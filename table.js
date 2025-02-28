/**
 * Creates a default table inside the spreadsheet container.
 * @param {HTMLElement} spreadsheetContainer - The container to add the table to.
 */
function createDefaultTable(spreadsheetContainer) {
    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    table.style.width = "100%";
    let tableHTML = "";

    const isDarkMode = document.body.dataset.theme === 'dark';
    const cellBgColor = isDarkMode ? '#2f2f2f' : 'white';
    const textColor = isDarkMode ? '#ffffff' : '#000';

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

    Array.from(table.getElementsByTagName('td')).forEach(cell => setupCellBehavior(cell));
}

/**
 * Saves the current table content to Chrome local storage.
 * @param {HTMLElement} spreadsheetContainer - The table container element.
 */
function saveTableContent(spreadsheetContainer) {
    const tableContent = spreadsheetContainer.innerHTML;
    let currentNote = 'note1';
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        currentNote = activeTab.getAttribute('data-note');
    }
    const storageKey = `tableContent_${currentNote}`;

    chrome.storage.local.set({
        [storageKey]: tableContent,
        tableContent: tableContent // Backward compatibility.
    });
}

/**
 * Loads saved table content from Chrome local storage.
 * @param {HTMLElement} spreadsheetContainer - The table container element.
 * @returns {Promise} Resolves when the table content is loaded.
 */
function loadTableContent(spreadsheetContainer) {
    return new Promise((resolve) => {
        let currentNote = 'note1';
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab) {
            currentNote = activeTab.getAttribute('data-note');
        }
        const storageKey = `tableContent_${currentNote}`;
        chrome.storage.local.get([storageKey, 'tableContent'], (result) => {
            if (result[storageKey]) {
                spreadsheetContainer.innerHTML = result[storageKey];
            } else if (result.tableContent) {
                spreadsheetContainer.innerHTML = result.tableContent;
            } else {
                createDefaultTable(spreadsheetContainer);
            }

            spreadsheetContainer.querySelectorAll('td, th').forEach(cell => setupCellBehavior(cell));
            resolve();
        });
    });
}

/**
 * Enables table mode by hiding text content, showing the table, and loading its content.
 * @param {HTMLElement} noteContent - The text note content element.
 * @param {HTMLElement} spreadsheetContainer - The table container element.
 * @param {HTMLElement} tabContainer - The container holding multi-note tabs.
 * @param {HTMLElement} insertDateButton - The insert date button.
 */
function enableTableMode(noteContent, spreadsheetContainer, tabContainer, insertDateButton) {
    noteContent.style.display = 'none';
    spreadsheetContainer.style.display = 'block';
    tabContainer.style.display = 'none';
    insertDateButton.disabled = true;
    insertDateButton.classList.add('disabled');

    const wordCount = document.getElementById('wordCount');
    if (wordCount) wordCount.style.display = 'none';

    const stylingButtonsContainer = document.querySelector('.styling-buttons');
    if (stylingButtonsContainer) stylingButtonsContainer.style.display = 'none';

    let selectionTip = document.getElementById('tableSelectionTip');
    if (!selectionTip) {
        selectionTip = document.createElement('div');
        selectionTip.id = 'tableSelectionTip';
        selectionTip.style.fontSize = '11px';
        selectionTip.style.color = '#fff';
        selectionTip.style.marginTop = '5px';
        selectionTip.style.textAlign = 'center';
        selectionTip.textContent = 'Shift+Click or Ctrl+Click to select multiple cells. Ctrl+C to copy selected cells.';
        spreadsheetContainer.parentNode.insertBefore(selectionTip, spreadsheetContainer.nextSibling);
    }
    selectionTip.style.display = 'block';

    loadTableContent(spreadsheetContainer).then(() => {
        updateTableCellStyles(document.body.dataset.theme === 'dark');
    });
}

/**
 * Disables table mode by saving table content and displaying text content.
 * @param {HTMLElement} noteContent - The text note content element.
 * @param {HTMLElement} spreadsheetContainer - The table container element.
 * @param {HTMLElement} tabContainer - The container holding multi-note tabs.
 * @param {HTMLElement} insertDateButton - The insert date button.
 * @param {boolean} enableTabs - Whether multi-note tabs are enabled.
 */
function disableTableMode(noteContent, spreadsheetContainer, tabContainer, insertDateButton, enableTabs) {
    saveTableContent(spreadsheetContainer);
    noteContent.style.display = 'block';
    spreadsheetContainer.style.display = 'none';
    if (enableTabs) tabContainer.style.display = 'flex';
    insertDateButton.disabled = false;
    insertDateButton.classList.remove('disabled');

    const wordCount = document.getElementById('wordCount');
    if (wordCount) wordCount.style.display = 'block';

    const selectionTip = document.getElementById('tableSelectionTip');
    if (selectionTip) selectionTip.style.display = 'none';
}

/**
 * Handles pasting Excel/spreadsheet data into the table.
 * @param {Event} e - The paste event.
 * @param {HTMLElement} spreadsheetContainer - The table container.
 */
function handleTablePaste(e, spreadsheetContainer) {
    const clipboardText = e.clipboardData.getData('text/plain');
    if (clipboardText.indexOf('\t') !== -1 && clipboardText.indexOf('\n') !== -1) {
        e.preventDefault();
        const rows = clipboardText.split(/\r?\n/).filter(row => row.trim() !== "");
        const newTable = document.createElement('table');
        newTable.style.width = '100%';
        newTable.style.borderCollapse = 'collapse';

        const isDarkMode = document.body.dataset.theme === 'dark';
        const cellBgColor = isDarkMode ? '#2f2f2f' : 'white';
        const textColor = isDarkMode ? '#ffffff' : '#000';

        rows.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            const cells = row.split('\t');
            cells.forEach(cellData => {
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
        spreadsheetContainer.innerHTML = "";
        spreadsheetContainer.appendChild(newTable);
        saveTableContent(spreadsheetContainer);
    }
}

/**
 * Sets up cell behavior for selection, copy, and navigation.
 * @param {HTMLTableCellElement} cell - The table cell element.
 */
function setupCellBehavior(cell) {
    // Modified click handler
    cell.addEventListener('click', (e) => {
        if (e.shiftKey || e.ctrlKey) {
            cell.classList.toggle('selected-cell');
        } else {
            // Clear previous selections
            document.querySelectorAll('td, th').forEach(c => c.classList.remove('selected-cell'));
            cell.classList.add('selected-cell');
        }

        // Always set focus to the clicked cell
        cell.focus();
        
        // Only select text content if not using modifier keys
        if (!e.shiftKey && !e.ctrlKey) {
            const range = document.createRange();
            range.selectNodeContents(cell);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });

    // Add blur handler to maintain selection state
    cell.addEventListener('blur', () => {
        // Don't remove selection on blur
        if (cell.classList.contains('selected-cell')) {
            cell.classList.add('selected-cell');
        }
    });

    // Rest of the existing cell event listeners remain unchanged
    cell.addEventListener('input', () => {
        clearTimeout(cell.saveTimeout);
        cell.saveTimeout = setTimeout(() => {
            const container = document.getElementById('spreadsheetContainer');
            if (container) saveTableContent(container);
        }, 500);
    });

    // Modified keydown handler
    cell.addEventListener('keydown', (e) => {
        const currentCell = e.target;
        switch (e.key) {
            case 'Tab': {
                e.preventDefault();
                const nextCell = e.shiftKey ? getPreviousCell(currentCell) : getNextCell(currentCell);
                if (nextCell) {
                    nextCell.click();
                    nextCell.focus();
                }
                break;
            }
            case 'Enter': {
                e.preventDefault();
                const cellBelow = getCellBelow(currentCell);
                if (cellBelow) {
                    cellBelow.click();
                    cellBelow.focus();
                } else if (!e.shiftKey) {
                    const table = currentCell.parentElement.parentElement;
                    const newRow = table.insertRow();
                    const isDarkMode = document.body.dataset.theme === 'dark';
                    const cellBgColor = isDarkMode ? '#2f2f2f' : 'white';
                    const textColor = isDarkMode ? '#ffffff' : '#000';
                    for (let i = 0; i < currentCell.parentElement.cells.length; i++) {
                        const newCell = newRow.insertCell();
                        newCell.contentEditable = true;
                        newCell.style.border = '1px solid #ccc';
                        newCell.style.padding = '5px';
                        newCell.style.backgroundColor = cellBgColor;
                        newCell.style.color = textColor;
                        newCell.style.minHeight = '20px';
                        newCell.style.height = '20px';
                        setupCellBehavior(newCell);
                    }
                    newRow.cells[Array.from(currentCell.parentElement.cells).indexOf(currentCell)].click();
                    newRow.cells[Array.from(currentCell.parentElement.cells).indexOf(currentCell)].focus();
                }
                break;
            }
            case 'c':
                if (e.ctrlKey) {
                    copySelectedCells();
                    e.preventDefault();
                }
                break;
        }
    });

    // Ensure proper color on focus
    cell.addEventListener('focus', () => {
        cell.style.color = (document.body.dataset.theme === 'dark') ? '#ffffff' : '#000000';
    });
}

function getNextCell(currentCell) {
    const nextCell = currentCell.nextElementSibling;
    if (nextCell) return nextCell;
    const nextRow = currentCell.parentElement.nextElementSibling;
    return nextRow ? nextRow.cells[0] : null;
}

function getPreviousCell(currentCell) {
    const prevCell = currentCell.previousElementSibling;
    if (prevCell) return prevCell;
    const prevRow = currentCell.parentElement.previousElementSibling;
    return prevRow ? prevRow.cells[prevRow.cells.length - 1] : null;
}

function getCellBelow(currentCell) {
    const row = currentCell.parentElement;
    const index = Array.from(row.cells).indexOf(currentCell);
    const nextRow = row.nextElementSibling;
    return nextRow ? nextRow.cells[index] : null;
}

/**
 * Copies the selected cells' content to the clipboard.
 */
function copySelectedCells() {
    const selectedCells = document.querySelectorAll('.selected-cell');
    if (selectedCells.length === 0) return;

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
        if (!cellMap.has(rowIndex)) cellMap.set(rowIndex, new Map());
        cellMap.get(rowIndex).set(colIndex, cell.innerText || '');
    });

    let copyText = '';
    const rowIndices = Array.from(cellMap.keys()).sort((a, b) => a - b);
    rowIndices.forEach(rowIndex => {
        const row = cellMap.get(rowIndex);
        const colIndices = Array.from(row.keys()).sort((a, b) => a - b);
        let rowText = '';
        colIndices.forEach(colIndex => {
            if (rowText) rowText += "\t";
            rowText += row.get(colIndex);
        });
        if (copyText) copyText += "\n";
        copyText += rowText;
    });
    navigator.clipboard.writeText(copyText).then(() => {
        selectedCells.forEach(cell => {
            cell.classList.add('copy-flash');
            setTimeout(() => cell.classList.remove('copy-flash'), 300);
        });
    }).catch(err => console.error('Copy failed:', err));
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'c' && e.ctrlKey && document.querySelectorAll('.selected-cell').length > 0) {
        copySelectedCells();
        e.preventDefault();
    }
});

/**
 * Updates table cell styles based on the current theme.
 * @param {boolean} isDarkMode - Whether dark mode is active.
 */
function updateTableCellStyles(isDarkMode) {
    const cells = document.querySelectorAll('td, th');
    const cellBgColor = isDarkMode ? '#2f2f2f' : 'white';
    const textColor = isDarkMode ? '#ffffff' : '#000';
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