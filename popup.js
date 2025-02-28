document.addEventListener('DOMContentLoaded', () => {
    const settingsIcon = document.getElementById('settingsIcon');
    const exportButton = document.getElementById('exportButton');
    const wordCount = document.getElementById('wordCount');
    const tabContainer = document.querySelector('.tab-container');
    const tabButtons = document.querySelectorAll('.tab-button');
    const popupBody = document.querySelector('.popup-body');
    const body = document.body;
    const boldButton = document.getElementById('boldButton');
    const italicButton = document.getElementById('italicButton');
    const underlineButton = document.getElementById('underlineButton');
    const resizeHandle = document.getElementById('resizeHandle');
    const stylingButtonsContainer = document.querySelector('.styling-buttons');
    const noteContent = document.getElementById('noteContent'); // Get your note content are
    const insertDateButton = document.getElementById('insertDateButton');
    const toggleTableMode = document.getElementById('toggleTableMode');
    const spreadsheetContainer = document.getElementById('spreadsheetContainer');
    const modeToggle = document.getElementById('modeToggle');

    let currentNote = 'note1';
    let enableTabs = true;

    setTimeout(() => {
        popupBody.classList.add('popup-open');
    }, 100);
    
    settingsIcon.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    document.body.classList.add('popup-open');

    // Load settings from storage
    chrome.storage.sync.get({
        'textAreaBgColor': '#F0FFF0',
        'showExportButton': false,
        'enableTabs': true,
        'showWordCount': true,
        'useLargeFont': false,
        'note1Name': 'Note 1',
        'note2Name': 'Note 2',
        'note3Name': 'Note 3',
        'backgroundColor': '#F0F8FF',
        'darkMode': false,
        'lastActiveTab': 'note1',
        'showStylingButtons': true,
        'tableMode': false,
        'hideTableModeToggle': false 
    }, (items) => {
        noteContent.style.backgroundColor = items.textAreaBgColor;
        stylingButtonsContainer.style.display = items.showStylingButtons && !items.tableMode ? 'block' : 'none';
        exportButton.style.display = items.showExportButton ? 'block' : 'none';
        enableTabs = items.enableTabs;
        if (items.showWordCount) {
            wordCount.style.display = 'block';
            updateWordCount();
        } else {
            wordCount.style.display = 'none';
        }

        noteContent.style.fontSize = items.useLargeFont ? '18px' : '14px';

        // Setup multi-note or single-note based on enableTabs
        if (enableTabs) {
            tabContainer.style.display = 'flex';
            tabButtons.forEach(button => {
                const noteId = button.getAttribute('data-note');
                button.textContent = items[`${noteId}Name`] || `Note ${noteId.slice(-1)}`;
            });
            setupTabs();
            currentNote = items.lastActiveTab; // Set the current note to the last active tab
            loadCurrentNoteContent();
            setActiveTabButton();
        } else {
            tabContainer.style.display = 'none';
            currentNote = 'singleNote';
            loadSingleNoteContent();
            tabButtons.forEach(button => {
                button.removeEventListener('click', handleTabClick);
            });
        }

        popupBody.style.backgroundColor = items.backgroundColor;
        body.dataset.theme = items.darkMode ? 'dark' : 'light';
        if (items.darkMode) {
            popupBody.style.backgroundColor = '#444';
        }

        // Update table mode based on the saved setting
        toggleTableMode.checked = items.tableMode;
        if (items.tableMode) {
            console.log("Initializing in table mode");
            enableTableMode(noteContent, spreadsheetContainer, tabContainer, insertDateButton);
        } else {
            console.log("Initializing in note mode");
            disableTableMode(noteContent, spreadsheetContainer, tabContainer, insertDateButton, enableTabs);
        }
        
        modeToggle.style.display = items.hideTableModeToggle ? 'flex' : 'none';
    });

    // Handle tab clicks
    function handleTabClick(event) {
        const button = event.currentTarget;
        saveCurrentNoteContent();
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentNote = button.getAttribute('data-note');
        loadCurrentNoteContent();
        chrome.storage.sync.set({ 'lastActiveTab': currentNote }); // Save last active tab
    }

    // Setup tabs
    function setupTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', handleTabClick);
        });
        loadCurrentNoteContent();
        setActiveTabButton();
    }

    // Load content for the current note
    function loadCurrentNoteContent() {
        const key = `textAreaContent_${currentNote}`;
        chrome.storage.sync.get([key], (result) => {
            // Replace newline characters with <br> tags for HTML rendering
            noteContent.innerHTML = (result[key] || '').replace(/\n/g, '<br>');
            updateWordCount();
        });
    }

    // Save content for the current note
    function saveCurrentNoteContent() {
        const key = `textAreaContent_${currentNote}`;
        chrome.storage.sync.set({ [key]: noteContent.innerHTML }); // Use innerHTML to save formatting
    }

    // Load content for the single note
    function loadSingleNoteContent() {
        const key = 'textAreaContent';
        chrome.storage.sync.get([key], (result) => {
            // Replace newline characters with <br> tags for HTML rendering
            noteContent.innerHTML = (result[key] || '').replace(/\n/g, '<br>');
            updateWordCount();
        });
    }

    // Save content for the single note
    function saveSingleNoteContent() {
        const key = 'textAreaContent';
        chrome.storage.sync.set({ [key]: noteContent.innerHTML }); // Use innerHTML
    }

    // Save content on input
    noteContent.addEventListener('input', () => {
        if (enableTabs) {
            saveCurrentNoteContent();
        } else {
            saveSingleNoteContent();
        }
        updateWordCount();
    });

    // Export Button Click
    exportButton.addEventListener('click', () => {
        let text;
        if (toggleTableMode.checked) {
            // Handle table export
            const table = spreadsheetContainer.querySelector('table');
            if (table) {
                const rows = Array.from(table.rows);
                text = rows.map(row => {
                    return Array.from(row.cells)
                        .map(cell => cell.innerText.trim())
                        .join('\t');
                }).join('\n');
            } else {
                text = ''; // Empty if no table exists
            }
        } else {
            // Handle regular note export
            text = noteContent.innerText;
        }

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        if (toggleTableMode.checked) {
            a.download = 'table.txt';
        } else if (enableTabs) {
            a.download = `${currentNote}.txt`;
        } else {
            a.download = 'note.txt';
        }
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Word Count Function
    function updateWordCount() {
        if (wordCount.style.display === 'none') return;
        const text = noteContent.innerText.trim(); // Use innerText for plain text
        const words = text ? text.split(/\s+/).length : 0;
        wordCount.textContent = `Words: ${words}`;
    }
    function setActiveTabButton() {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        const activeTabButton = document.querySelector(`.tab-button[data-note="${currentNote}"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('active');
        }
    }

    // Listen for messages to update tab names or add text to notes
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'addTextToNote') {
            // Ensure the note content is updated with any existing content before appending
            const noteId = request.noteId;
            const key = noteId === 'singleNote' ? 'textAreaContent' : `textAreaContent_${noteId}`;
            chrome.storage.sync.get([key], (result) => {
                const existingContent = result[key] || '';
                const newContent = existingContent + request.selectedText;
                chrome.storage.sync.set({ [key]: newContent }, () => {
                    if (enableTabs) {
                        currentNote = noteId; // Switch to the note that was added to
                        loadCurrentNoteContent();
                        setActiveTabButton();
                    } else {
                        loadSingleNoteContent();
                    }
                    updateWordCount();
                });
            });
        } else if (request.action === 'getTableContent') {
            // Send the current table content from the spreadsheet container
            sendResponse({ tableHTML: spreadsheetContainer.innerHTML });
            return true; // Required for async response
        } else if (request.action === 'updateTableContent') {
            console.log("Received updated table content from table manager");
            // Update the table content in the popup when changed in table manager
            spreadsheetContainer.innerHTML = request.tableHTML;
            
            // Save the updated table content
            // Get the current note ID from the active tab or use a default
            let currentNote = 'note1';
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab) {
                currentNote = activeTab.getAttribute('data-note');
            }
            
            // Use a specific storage key for each note's table content
            const storageKey = `tableContent_${currentNote}`;
            
            chrome.storage.local.set({
                [storageKey]: request.tableHTML,
                'tableContent': request.tableHTML // For backward compatibility
            });
            return true;
        }
    });

  

    boldButton.addEventListener('click', () => {
        noteContent.focus(); // Focus first
        document.execCommand('bold', false, null);
        saveCurrentNoteContent(); // Save the changes
        updateButtonStates();
    });
    
    italicButton.addEventListener('click', () => {
        noteContent.focus(); // Focus first
        document.execCommand('italic', false, null);
        saveCurrentNoteContent(); // Save the changes
        updateButtonStates();
    });
    
    underlineButton.addEventListener('click', () => {
        noteContent.focus(); // Focus first
        document.execCommand('underline', false, null);
        saveCurrentNoteContent(); // Save the changes
        updateButtonStates();
    });

    function insertHtmlAtCursor(html) {
        let sel, range;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                // Create a temporary container to hold the HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const frag = document.createDocumentFragment();
                let node, lastNode;
                while ((node = tempDiv.firstChild)) {
                    lastNode = frag.appendChild(node);
                }
                range.insertNode(frag);
                // Move the cursor after the inserted content
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        } else if (document.selection && document.selection.createRange) {
            // For IE < 9
            document.selection.createRange().pasteHTML(html);
        }
    }

    insertDateButton.addEventListener('click', () => {
        // Ensure the note content area is focused
        noteContent.focus();
        
        // Get the current date in local format (without the time)
        const today = new Date();
        const dateValue = today.toLocaleDateString(); // e.g., "10/12/2023"
        
        // Prepare the HTML with a <br> tag for a new line
        const htmlToInsert = dateValue + '<br>';
        
        // Insert the HTML at the current cursor position and reposition the caret
        insertHtmlAtCursor(htmlToInsert);
        
        // Save the updated content
        saveCurrentNoteContent();
    });

    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    let resizeScheduled = false;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(popupBody).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(popupBody).height, 10);
        e.preventDefault(); // Prevent text selection during resize
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        if (!resizeScheduled) {
            resizeScheduled = true;

            requestAnimationFrame(() => {
                // Calculate the change in mouse position
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                // Adjust the width and height, inverting the horizontal calculation
                const width = startWidth - (deltaX * 0.5); // Invert by using subtraction
                const height = startHeight + (deltaY * 0.5); // Adjust sensitivity here

                console.log("Setting popupBody height to:", height + 'px');
                // Apply the new dimensions to the popup
                popupBody.style.width = width + 'px';
                popupBody.style.height = height + 'px';

                resizeScheduled = false;
            });
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
    });

    function updateButtonStates() {
        boldButton.classList.toggle('active', document.queryCommandState('bold'));
        italicButton.classList.toggle('active', document.queryCommandState('italic'));
        underlineButton.classList.toggle('active', document.queryCommandState('underline'));
    }

    // Update button states when the note content changes
    noteContent.addEventListener('input', updateButtonStates);
    noteContent.addEventListener('keyup', updateButtonStates); // For keyboard shortcuts
    noteContent.addEventListener('mouseup', updateButtonStates);

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'addTextToNote') {
            // Only update if we're on the correct note tab
            if (currentNote === request.noteId) {
                // Append the new text to the note content
                noteContent.innerHTML += request.selectedText;
                updateWordCount(); // Update word count if it's enabled
            }
        }
    });

    if (!toggleTableMode || !noteContent || !spreadsheetContainer) {
        console.error("One or more required elements are missing. Please ensure that popup.html contains elements with ids: toggleTableMode, noteContent, and spreadsheetContainer.");
        return;
    }

    // For debugging: log the initial state of the toggle.
    console.log("Initial table mode:", toggleTableMode.checked);

    // Save table content when the popup is closing
    window.addEventListener('beforeunload', () => {
        if (toggleTableMode.checked) {
            saveTableContent(spreadsheetContainer);
        }
    });

    // Set up event delegation for table content changes
    spreadsheetContainer.addEventListener('input', (e) => {
        if (e.target.tagName === 'TD' || e.target.tagName === 'TH') {
            // Debounce the save operation to avoid excessive saves
            clearTimeout(spreadsheetContainer.saveTimeout);
            spreadsheetContainer.saveTimeout = setTimeout(() => {
                saveTableContent(spreadsheetContainer);
            }, 500); // Save after 500ms of no input
        }
    });

    chrome.storage.onChanged.addListener((changes) => {
        if (changes.hideTableModeToggle) {
            modeToggle.style.display = !changes.hideTableModeToggle.newValue ? 'none' : 'flex';
        }
        if (changes.darkMode && toggleTableMode.checked) {
            const isDarkMode = changes.darkMode.newValue;
            updateTableCellStyles(isDarkMode);
        }
    });

    toggleTableMode.addEventListener('change', (e) => {
        console.log("Table mode toggled:", e.target.checked);
        
        if (e.target.checked) {
            // Save the current note content before switching to table mode
            if (enableTabs) {
                saveCurrentNoteContent();
            } else {
                saveSingleNoteContent();
            }
            
            // Enable table mode
            enableTableMode(noteContent, spreadsheetContainer, tabContainer, insertDateButton);
            stylingButtonsContainer.style.display = 'none';
            
            // Create and show tooltip for table selection
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
        } else {
            // Disable table mode
            disableTableMode(noteContent, spreadsheetContainer, tabContainer, insertDateButton, enableTabs);
            
            // Restore styling buttons visibility based on settings
            chrome.storage.sync.get({ 'showStylingButtons': true }, (items) => {
                stylingButtonsContainer.style.display = items.showStylingButtons ? 'block' : 'none';
            });
            
            // Load the current note content
            if (enableTabs) {
                loadCurrentNoteContent();
            } else {
                loadSingleNoteContent();
            }
        }
        
        // Save the new table mode setting
        chrome.storage.sync.set({ 'tableMode': e.target.checked });
    });

    // Update the spreadsheetContainer paste event listener
    spreadsheetContainer.addEventListener('paste', (e) => {
        handleTablePaste(e, spreadsheetContainer);
    });
});