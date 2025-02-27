/**
 * Creates a default table if none exists inside the spreadsheet container.
 * @param {HTMLElement} spreadsheetContainer - The container to add the table to
 */
function createDefaultTable(spreadsheetContainer) {
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";
  let tableHTML = "";
  
  // Check if dark mode is active
  const isDarkMode = document.body.dataset.theme === 'dark';
  const cellBgColor = isDarkMode ? '#555' : 'white';
  const textColor = isDarkMode ? '#fff' : '#000';
  
  // Create 5 rows and 2 columns with empty cells.
  for (let row = 1; row <= 5; row++) {
    tableHTML += `
      <tr>
        <td contenteditable="true" style="border: 1px solid #ccc; padding: 5px; background-color: ${cellBgColor}; color: ${textColor}; min-height: 20px; height: 20px;"></td>
        <td contenteditable="true" style="border: 1px solid #ccc; padding: 5px; background-color: ${cellBgColor}; color: ${textColor}; min-height: 20px; height: 20px;"></td>
      </tr>
    `;
  }
  table.innerHTML = tableHTML;
  spreadsheetContainer.appendChild(table);
  
  // Ensure consistent cell styles
  const cells = table.getElementsByTagName('td');
  Array.from(cells).forEach(cell => {
    cell.style.lineHeight = '20px';
    cell.style.minHeight = '20px';
    cell.style.height = '20px';
    setupCellBehavior(cell);
  });
}

/**
 * Enables table mode by hiding text content and showing the table.
 * @param {HTMLElement} noteContent - The text note content element
 * @param {HTMLElement} spreadsheetContainer - The table container element
 * @param {HTMLElement} tabContainer - The tab container for multi-notes
 * @param {HTMLElement} insertDateButton - The date insertion button
 */
function enableTableMode(noteContent, spreadsheetContainer, tabContainer, insertDateButton) {
  // Hide text mode and show table mode
  noteContent.style.display = 'none';
  spreadsheetContainer.style.display = 'block';
  
  // Hide the multi-note tabs regardless of settings
  tabContainer.style.display = 'none';
  
  // Disable the calendar icon button
  insertDateButton.disabled = true;
  insertDateButton.classList.add('disabled');
  
  // Hide word count when in table mode
  const wordCount = document.getElementById('wordCount');
  if (wordCount) {
    wordCount.style.display = 'none';
  }

  // Create a default table if none exists
  if (spreadsheetContainer.innerHTML.trim() === "") {
    createDefaultTable(spreadsheetContainer);
  } else {
    // Update existing table cells for current theme
    const isDarkMode = document.body.dataset.theme === 'dark';
    updateTableCellStyles(isDarkMode);
  }
}

/**
 * Disables table mode by showing text content and hiding the table.
 * @param {HTMLElement} noteContent - The text note content element
 * @param {HTMLElement} spreadsheetContainer - The table container element
 * @param {HTMLElement} tabContainer - The tab container for multi-notes
 * @param {HTMLElement} insertDateButton - The date insertion button
 * @param {boolean} enableTabs - Whether multi-note tabs are enabled
 */
function disableTableMode(noteContent, spreadsheetContainer, tabContainer, insertDateButton, enableTabs) {
  // Show text mode and hide table mode
  noteContent.style.display = 'block';
  spreadsheetContainer.style.display = 'none';
  
  // Show multi-note tabs if enabled
  if (enableTabs) {
    tabContainer.style.display = 'flex';
  }
  
  // Re-enable the calendar icon
  insertDateButton.disabled = false;
  insertDateButton.classList.remove('disabled');
  
  // Restore word count display based on settings
  const wordCount = document.getElementById('wordCount');
  if (wordCount) {
    chrome.storage.sync.get({ 'showWordCount': true }, (items) => {
      wordCount.style.display = items.showWordCount ? 'block' : 'none';
    });
  }
}

/**
 * Handles pasting Excel/spreadsheet data into the table.
 * @param {Event} e - The paste event
 * @param {HTMLElement} spreadsheetContainer - The table container
 */
function handleTablePaste(e, spreadsheetContainer) {
  console.log("Paste event detected in spreadsheet container.");
  
  // Get plain text from the clipboard
  const clipboardText = e.clipboardData.getData('text/plain');
  
  // Check if the pasted content has both tabs and newlines (typical for Excel data)
  if (clipboardText.indexOf('\t') !== -1 && clipboardText.indexOf('\n') !== -1) {
    e.preventDefault();  // Prevent the default paste behavior

    console.log("Excel data detected in paste.");
    const rows = clipboardText.split(/\r?\n/).filter(row => row.trim() !== "");
    const newTable = document.createElement('table');
    newTable.style.width = '100%';
    newTable.style.borderCollapse = 'collapse';

    // Check if dark mode is active
    const isDarkMode = document.body.dataset.theme === 'dark';
    const cellBgColor = isDarkMode ? '#555' : 'white';
    const textColor = isDarkMode ? '#fff' : '#000';

    rows.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      const cells = row.split('\t');
      cells.forEach(cellData => {
        // Use <th> for the first row (header), <td> for the subsequent rows
        const cell = document.createElement(rowIndex === 0 ? 'th' : 'td');
        cell.innerText = cellData;
        cell.contentEditable = true;
        cell.style.border = '1px solid #ccc';
        cell.style.padding = '5px';
        cell.style.backgroundColor = cellBgColor;
        cell.style.color = textColor;
        setupCellBehavior(cell);
        tr.appendChild(cell);
      });
      newTable.appendChild(tr);
    });

    // Replace the current content of the container with the new table
    spreadsheetContainer.innerHTML = "";
    spreadsheetContainer.appendChild(newTable);
  }
}

/**
 * Handles cell selection and editing behavior
 * @param {HTMLTableCellElement} cell - The table cell element
 */
function setupCellBehavior(cell) {
  cell.addEventListener('click', (e) => {
    // Remove selection from all other cells
    const allCells = document.querySelectorAll('td, th');
    allCells.forEach(c => c.classList.remove('selected-cell'));
    
    // Add selection to clicked cell
    cell.classList.add('selected-cell');
    
    // Select all text in the cell when clicked
    const range = document.createRange();
    range.selectNodeContents(cell);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });

  cell.addEventListener('keydown', (e) => {
    const currentCell = e.target;
    const currentRow = currentCell.parentElement;
    const currentIndex = Array.from(currentRow.cells).indexOf(currentCell);
    
    switch(e.key) {
      case 'Tab':
        e.preventDefault();
        // Move to next cell or create new row if at the end
        const nextCell = e.shiftKey ? 
          getPreviousCell(currentCell) : 
          getNextCell(currentCell);
        
        if (nextCell) {
          nextCell.click();
          nextCell.focus();
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        // Move to cell below or create new row if at the bottom
        const cellBelow = getCellBelow(currentCell);
        if (cellBelow) {
          cellBelow.click();
          cellBelow.focus();
        } else if (!e.shiftKey) {
          // Create new row when pressing Enter on the last row
          const table = currentRow.parentElement;
          const newRow = table.insertRow();
          for (let i = 0; i < currentRow.cells.length; i++) {
            const newCell = newRow.insertCell();
            newCell.contentEditable = true;
            newCell.style.border = '1px solid #ccc';
            newCell.style.padding = '5px';
            newCell.style.backgroundColor = 'white';
            newCell.style.minHeight = '20px';
            newCell.style.height = '20px';
            setupCellBehavior(newCell);
          }
          newRow.cells[currentIndex].click();
          newRow.cells[currentIndex].focus();
        }
        break;
    }
  });
}

function getNextCell(currentCell) {
  const currentRow = currentCell.parentElement;
  const nextCell = currentCell.nextElementSibling;
  
  if (nextCell) {
    return nextCell;
  } else {
    // Move to first cell of next row
    const nextRow = currentRow.nextElementSibling;
    if (nextRow) {
      return nextRow.cells[0];
    }
  }
  return null;
}

function getPreviousCell(currentCell) {
  const currentRow = currentCell.parentElement;
  const previousCell = currentCell.previousElementSibling;
  
  if (previousCell) {
    return previousCell;
  } else {
    // Move to last cell of previous row
    const previousRow = currentRow.previousElementSibling;
    if (previousRow) {
      return previousRow.cells[previousRow.cells.length - 1];
    }
  }
  return null;
}

function getCellBelow(currentCell) {
  const currentRow = currentCell.parentElement;
  const currentIndex = Array.from(currentRow.cells).indexOf(currentCell);
  const nextRow = currentRow.nextElementSibling;
  
  if (nextRow) {
    return nextRow.cells[currentIndex];
  }
  return null;
}

/**
 * Updates table cell styles based on the current theme
 * @param {boolean} isDarkMode - Whether dark mode is active
 */
function updateTableCellStyles(isDarkMode) {
  const cells = document.querySelectorAll('td, th');
  const cellBgColor = isDarkMode ? '#555' : 'white';
  const textColor = isDarkMode ? '#fff' : '#000';
  
  cells.forEach(cell => {
    cell.style.backgroundColor = cellBgColor;
    cell.style.color = textColor;
  });
} 