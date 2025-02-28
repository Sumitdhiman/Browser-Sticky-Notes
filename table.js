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
  const cellBgColor = isDarkMode ? '#2f2f2f' : 'white';
  const textColor = isDarkMode ? '#fff' : '#000';
  
  // Create 10 rows and 3 columns with empty cells.
  for (let row = 1; row <= 10; row++) {
    tableHTML += `
      <tr>
        <td contenteditable="true" style="border: 1px solid #ccc; padding: 5px; background-color: ${cellBgColor}; color: ${textColor}; min-height: 20px; height: 20px;"></td>
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
 * Saves the current table content to Chrome storage.
 * @param {HTMLElement} spreadsheetContainer - The table container element
 */
function saveTableContent(spreadsheetContainer) {
  console.log("Saving table content...");
  const tableContent = spreadsheetContainer.innerHTML;
  
  // Get the current note ID from the active tab or use a default
  let currentNote = 'note1';
  const activeTab = document.querySelector('.tab-button.active');
  if (activeTab) {
    currentNote = activeTab.getAttribute('data-note');
  }
  
  // Use a specific storage key for each note's table content
  const storageKey = `tableContent_${currentNote}`;
  
  // Save to Chrome local storage (not sync) because table content can be large
  chrome.storage.local.set({
    [storageKey]: tableContent,
    // Also save to the generic key for backward compatibility
    'tableContent': tableContent
  }, () => {
    console.log(`Table content saved to storage for ${currentNote}`);
  });
  debugStorageContent();
}

/**
 * Loads the saved table content from Chrome storage.
 * @param {HTMLElement} spreadsheetContainer - The table container element
 * @returns {Promise} A promise that resolves when the table content is loaded
 */
function loadTableContent(spreadsheetContainer) {
  return new Promise((resolve) => {
    // Get the current note ID from the active tab or use a default
    let currentNote = 'note1';
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
      currentNote = activeTab.getAttribute('data-note');
    }
    
    // Use a specific storage key for each note's table content
    const storageKey = `tableContent_${currentNote}`;
    console.log(`Attempting to load table content for ${currentNote} using key: ${storageKey}`);
    
    // Try to load note-specific table content first, fall back to generic tableContent
    chrome.storage.local.get([storageKey, 'tableContent'], (result) => {
      console.log("Storage result:", result);
      
      if (result[storageKey]) {
        // Use note-specific table content if available
        console.log(`Found table content for ${currentNote}, loading it...`);
        spreadsheetContainer.innerHTML = result[storageKey];
      } else if (result.tableContent) {
        // Fall back to generic table content for backward compatibility
        console.log('Found generic table content, loading it...');
        spreadsheetContainer.innerHTML = result.tableContent;
      } else {
        // Create a default table if no saved content
        console.log('No saved table content found, creating default table...');
        createDefaultTable(spreadsheetContainer);
      }
      
      // Re-attach event listeners to all cells
      const cells = spreadsheetContainer.querySelectorAll('td, th');
      cells.forEach(cell => {
        setupCellBehavior(cell);
      });
      
      resolve();
    });
  }).then(() => {
    debugStorageContent();
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
  console.log("Enabling table mode - loading table content");
  
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
  
  // Hide styling buttons when in table mode
  const stylingButtonsContainer = document.querySelector('.styling-buttons');
  if (stylingButtonsContainer) {
    stylingButtonsContainer.style.display = 'none';
  }

  // Create and show the selection tip
  let selectionTip = document.getElementById('tableSelectionTip');
  if (!selectionTip) {
    selectionTip = document.createElement('div');
    selectionTip.id = 'tableSelectionTip';
    selectionTip.style.fontSize = '11px';
    selectionTip.style.color = '#666';
    selectionTip.style.marginTop = '5px';
    selectionTip.style.textAlign = 'center';
    selectionTip.textContent = 'Shift+Click or Ctrl+Click to select multiple cells. Ctrl+C to copy selected cells.';
    spreadsheetContainer.parentNode.insertBefore(selectionTip, spreadsheetContainer.nextSibling);
  }
  selectionTip.style.display = 'block';

  // Load table content from storage
  loadTableContent(spreadsheetContainer).then(() => {
    // Update cell styles after content is loaded
    const isDarkMode = document.body.dataset.theme === 'dark';
    updateTableCellStyles(isDarkMode);
  });
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
  // Save the table content before switching modes
  console.log("Disabling table mode - saving table content first");
  saveTableContent(spreadsheetContainer);
  
  // Show text mode and hide table mode
  noteContent.style.display = 'block';
  spreadsheetContainer.style.display = 'none';
  
  // Show multi-note tabs if enabled
  if (enableTabs) {
    tabContainer.style.display = 'flex';
  }
  
  // Re-enable the calendar icon button
  insertDateButton.disabled = false;
  insertDateButton.classList.remove('disabled');
  
  // Show word count when exiting table mode
  const wordCount = document.getElementById('wordCount');
  if (wordCount) {
    wordCount.style.display = 'block';
  }
  
  // Hide the selection tip
  const selectionTip = document.getElementById('tableSelectionTip');
  if (selectionTip) {
    selectionTip.style.display = 'none';
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
    
    // Save the newly pasted table data
    saveTableContent(spreadsheetContainer);
  }
}

/**
 * Handles cell selection and editing behavior
 * @param {HTMLTableCellElement} cell - The table cell element
 */
function setupCellBehavior(cell) {
  cell.addEventListener('click', (e) => {
    // Handle multi-selection with Shift or Ctrl key
    if (e.shiftKey || e.ctrlKey) {
      // Add to selection without removing previous selections
      cell.classList.toggle('selected-cell');
    } else {
      // Regular click - remove selection from all other cells
      const allCells = document.querySelectorAll('td, th');
      allCells.forEach(c => c.classList.remove('selected-cell'));
      
      // Add selection to clicked cell
      cell.classList.add('selected-cell');
    }
    
    // Only select text if it's a single cell selection (no modifier keys)
    if (!e.shiftKey && !e.ctrlKey) {
      // Select all text in the cell when clicked
      const range = document.createRange();
      range.selectNodeContents(cell);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });

  // Add input event listener to save table content when cell content changes
  cell.addEventListener('input', () => {
    console.log('Cell content changed, saving table content');
    // Get the spreadsheet container
    const spreadsheetContainer = document.querySelector('.spreadsheet-container');
    if (spreadsheetContainer) {
      // Use a debounce to avoid saving too frequently
      clearTimeout(cell.saveTimeout);
      cell.saveTimeout = setTimeout(() => {
        saveTableContent(spreadsheetContainer);
      }, 500); // Save after 500ms of no input
    }
  });

  cell.addEventListener('keydown', (e) => {
    const currentCell = e.target;
    const currentRow = currentCell.parentElement;
    const currentIndex = Array.from(currentRow.cells).indexOf(currentCell);
    
    // Handle Ctrl+C to copy selected cells
    if (e.key === 'c' && e.ctrlKey) {
      copySelectedCells();
      return;
    }
    
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
          
          // Save table content after adding a new row
          const spreadsheetContainer = document.querySelector('.spreadsheet-container');
          if (spreadsheetContainer) {
            saveTableContent(spreadsheetContainer);
          }
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
 * Copies selected cells to clipboard in a format suitable for spreadsheet applications
 */
function copySelectedCells() {
  const selectedCells = document.querySelectorAll('.selected-cell');
  if (selectedCells.length === 0) return;
  
  // Get all selected cells and organize them by row and column
  const cellMap = new Map();
  let minRow = Infinity;
  let minCol = Infinity;
  
  selectedCells.forEach(cell => {
    const row = cell.parentElement;
    const table = row.parentElement;
    const rowIndex = Array.from(table.rows).indexOf(row);
    const colIndex = Array.from(row.cells).indexOf(cell);
    
    minRow = Math.min(minRow, rowIndex);
    minCol = Math.min(minCol, colIndex);
    
    if (!cellMap.has(rowIndex)) {
      cellMap.set(rowIndex, new Map());
    }
    cellMap.get(rowIndex).set(colIndex, cell.innerText || '');
  });
  
  // Create a text representation suitable for pasting into Excel
  let copyText = '';
  
  // Sort rows to ensure they're in order
  const rowIndices = Array.from(cellMap.keys()).sort((a, b) => a - b);
  
  rowIndices.forEach(rowIndex => {
    const row = cellMap.get(rowIndex);
    const colIndices = Array.from(row.keys()).sort((a, b) => a - b);
    
    let rowText = '';
    colIndices.forEach(colIndex => {
      if (rowText) rowText += '\t';
      rowText += row.get(colIndex);
    });
    
    if (copyText) copyText += '\n';
    copyText += rowText;
  });
  
  // Copy to clipboard
  navigator.clipboard.writeText(copyText)
    .then(() => {
      // Flash the selected cells to indicate successful copy
      selectedCells.forEach(cell => {
        cell.classList.add('copy-flash');
        setTimeout(() => {
          cell.classList.remove('copy-flash');
        }, 300);
      });
    })
    .catch(err => {
      console.error('Failed to copy cells: ', err);
    });
}

// Add global event listener for Ctrl+C to copy selected cells
document.addEventListener('keydown', (e) => {
  if (e.key === 'c' && e.ctrlKey && document.querySelectorAll('.selected-cell').length > 0) {
    copySelectedCells();
    e.preventDefault(); // Prevent default copy behavior
  }
});

/**
 * Updates table cell styles based on the current theme
 * @param {boolean} isDarkMode - Whether dark mode is active
 */
function updateTableCellStyles(isDarkMode) {
  const cells = document.querySelectorAll('td, th');
  const cellBgColor = isDarkMode ? '#2f2f2f' : 'white';
  const textColor = isDarkMode ? '#fff' : '#000';
  
  cells.forEach(cell => {
    if (!cell.classList.contains('selected-cell')) {
      cell.style.backgroundColor = cellBgColor;
      cell.style.color = textColor;
    }
  });
}

/**
 * Debug function to check what's stored in Chrome storage
 */
function debugStorageContent() {
  chrome.storage.local.get(null, (items) => {
    console.log('All storage items:', items);
    
    // Check for table content specifically
    const tableContentKeys = Object.keys(items).filter(key => key.startsWith('tableContent'));
    console.log('Table content keys:', tableContentKeys);
    
    // Log the current note
    let currentNote = 'note1';
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
      currentNote = activeTab.getAttribute('data-note');
    }
    console.log('Current note:', currentNote);
    
    // Check if there's table content for the current note
    const currentNoteKey = `tableContent_${currentNote}`;
    console.log(`Table content for ${currentNote}:`, items[currentNoteKey] ? 'exists' : 'does not exist');
  });
}