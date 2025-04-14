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
    // Encrypt before saving
    const encrypted = encrypt(tableContent);
    let currentNote = 'note1';
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        currentNote = activeTab.getAttribute('data-note');
    }
    const storageKey = `tableContent_${currentNote}`;

    chrome.storage.local.set({
        [storageKey]: encrypted,
        tableContent: encrypted // Backward compatibility.
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
            let html = '';
            if (result[storageKey]) {
                html = decrypt(result[storageKey]);
            } else if (result.tableContent) {
                html = decrypt(result.tableContent);
            }
            if (html) {
                spreadsheetContainer.innerHTML = html;
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

    // Show table controls
    const tableControlsContainer = document.getElementById('tableControlsContainer');
    if (tableControlsContainer) tableControlsContainer.style.display = 'block';

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
        setupTableControls(spreadsheetContainer);
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
    
    // Hide table controls
    const tableControlsContainer = document.getElementById('tableControlsContainer');
    if (tableControlsContainer) tableControlsContainer.style.display = 'none';
}

/**
 * Sets up event listeners for table control buttons
 * @param {HTMLElement} spreadsheetContainer - The container with the table
 */
function setupTableControls(spreadsheetContainer) {
    const addRowBtn = document.getElementById('addRowButton');
    const addColBtn = document.getElementById('addColumnButton');
    const deleteRowBtn = document.getElementById('deleteRowButton');
    const deleteColBtn = document.getElementById('deleteColumnButton');

    if (addRowBtn) {
        addRowBtn.onclick = () => addRow(spreadsheetContainer);
    }
    
    if (addColBtn) {
        addColBtn.onclick = () => addColumn(spreadsheetContainer);
    }
    
    if (deleteRowBtn) {
        deleteRowBtn.onclick = () => deleteRow(spreadsheetContainer);
    }
    
    if (deleteColBtn) {
        deleteColBtn.onclick = () => deleteColumn(spreadsheetContainer);
    }
}

/**
 * Adds a new row to the table
 * @param {HTMLElement} spreadsheetContainer - The container with the table
 */
function addRow(spreadsheetContainer) {
    const table = spreadsheetContainer.querySelector('table');
    if (!table) return;
    
    // Determine position: if a row is selected, add after that row
    const selectedCell = spreadsheetContainer.querySelector('.selected-cell');
    let rowIndex = table.rows.length; // Default to end of table
    
    if (selectedCell) {
        const selectedRow = selectedCell.parentElement;
        rowIndex = Array.from(table.rows).indexOf(selectedRow) + 1;
    }
    
    const newRow = table.insertRow(rowIndex);
    const colCount = table.rows[0].cells.length;
    
    // Get theme-specific styles
    const isDarkMode = document.body.dataset.theme === 'dark';
    const cellBgColor = isDarkMode ? '#2f2f2f' : 'white';
    const textColor = isDarkMode ? '#ffffff' : '#000';
    
    // Add cells to the new row
    for (let i = 0; i < colCount; i++) {
        const cell = newRow.insertCell();
        cell.contentEditable = true;
        cell.style.border = '1px solid #ccc';
        cell.style.padding = '5px';
        cell.style.backgroundColor = cellBgColor;
        cell.style.color = textColor;
        cell.style.minHeight = '20px';
        cell.style.height = '20px';
        setupCellBehavior(cell);
    }
    
    saveTableContent(spreadsheetContainer);
    
    // Temporary highlight to show the new row
    newRow.style.transition = 'background-color 0.5s ease';
    newRow.style.backgroundColor = isDarkMode ? '#404d40' : '#e8f5e9';
    setTimeout(() => {
        newRow.style.backgroundColor = '';
    }, 1000);
}

/**
 * Adds a new column to the table
 * @param {HTMLElement} spreadsheetContainer - The container with the table
 */
function addColumn(spreadsheetContainer) {
    const table = spreadsheetContainer.querySelector('table');
    if (!table || table.rows.length === 0) return;
    
    // Determine position: if a cell is selected, add after that column
    const selectedCell = spreadsheetContainer.querySelector('.selected-cell');
    let colIndex = table.rows[0].cells.length; // Default to end of table
    
    if (selectedCell) {
        colIndex = Array.from(selectedCell.parentElement.cells).indexOf(selectedCell) + 1;
    }
    
    // Get theme-specific styles
    const isDarkMode = document.body.dataset.theme === 'dark';
    const cellBgColor = isDarkMode ? '#2f2f2f' : 'white';
    const textColor = isDarkMode ? '#ffffff' : '#000';
    
    // Add a new cell to each row
    Array.from(table.rows).forEach(row => {
        const cell = row.insertCell(colIndex);
        cell.contentEditable = true;
        cell.style.border = '1px solid #ccc';
        cell.style.padding = '5px';
        cell.style.backgroundColor = cellBgColor;
        cell.style.color = textColor;
        cell.style.minHeight = '20px';
        cell.style.height = '20px';
        setupCellBehavior(cell);
        
        // Temporary highlight to show the new column
        cell.style.transition = 'background-color 0.5s ease';
        cell.style.backgroundColor = isDarkMode ? '#404d40' : '#e8f5e9';
        setTimeout(() => {
            cell.style.backgroundColor = cellBgColor;
        }, 1000);
    });
    
    saveTableContent(spreadsheetContainer);
}

/**
 * Deletes a row from the table
 * @param {HTMLElement} spreadsheetContainer - The container with the table
 */
function deleteRow(spreadsheetContainer) {
    const table = spreadsheetContainer.querySelector('table');
    if (!table || table.rows.length <= 1) return; // Keep at least one row
    
    // Find selected row
    const selectedCell = spreadsheetContainer.querySelector('.selected-cell');
    if (!selectedCell) {
        alert('Please select a cell in the row you want to delete');
        return;
    }
    
    const rowIndex = Array.from(table.rows).indexOf(selectedCell.parentElement);
    table.deleteRow(rowIndex);
    
    saveTableContent(spreadsheetContainer);
}

/**
 * Deletes a column from the table
 * @param {HTMLElement} spreadsheetContainer - The container with the table
 */
function deleteColumn(spreadsheetContainer) {
    const table = spreadsheetContainer.querySelector('table');
    if (!table || table.rows.length === 0 || table.rows[0].cells.length <= 1) {
        return; // Keep at least one column
    }
    
    // Find selected column
    const selectedCell = spreadsheetContainer.querySelector('.selected-cell');
    if (!selectedCell) {
        alert('Please select a cell in the column you want to delete');
        return;
    }
    
    const colIndex = Array.from(selectedCell.parentElement.cells).indexOf(selectedCell);
    
    // Delete the cell at the same column index from each row
    Array.from(table.rows).forEach(row => {
        if (row.cells.length > colIndex) {
            row.deleteCell(colIndex);
        }
    });
    
    saveTableContent(spreadsheetContainer);
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
function encrypt(text) {
    return btoa(Array.from(text).map((c, i) => 
        String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
    ).join(''));
}
function decrypt(data) {
    try {
        const decoded = atob(data);
        return Array.from(decoded).map((c, i) => 
            String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
        ).join('');
    } catch {
        return data; // fallback for unencrypted/legacy data
    }
}