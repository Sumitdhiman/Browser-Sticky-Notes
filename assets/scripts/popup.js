import { encrypt, decrypt } from './encryption.js';

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
    const addNoteButton = document.getElementById('addNoteButton');

    let currentNote = 'note1';
    let enableTabs = true;
    let noteCount = 3; // Initial count of default notes

    setTimeout(() => {
        popupBody.classList.add('popup-open');
    }, 100);
    
    settingsIcon.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    document.body.classList.add('popup-open');

    // Load settings from storage
    chrome.storage.sync.get({
        'textAreaBgColor': '#E0FFFF',
        'showExportButton': false,
        'enableTabs': true,
        'showWordCount': true,
        'useLargeFont': false,
        'note1Name': 'Note 1',
        'note2Name': 'Note 2',
        'note3Name': 'Note 3',
        'backgroundColor': '#FAFAD2',
        'darkMode': false,
        'lastActiveTab': 'note1',
        'showStylingButtons': true,
        'tableMode': false,
        'tableModeUnlocked': false
    }, async (items) => {
        noteContent.style.backgroundColor = items.textAreaBgColor;
        if (items.showStylingButtons && !items.tableMode) {
            stylingButtonsContainer.style.removeProperty('display');
        } else {
            stylingButtonsContainer.style.display = 'none';
        }
        exportButton.style.display = items.showExportButton ? 'block' : 'none';
        // Set initial export button label based on table mode
        exportButton.textContent = items.tableMode ? 'Export CSV' : 'Export TXT';
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
            await restoreCustomNotes();
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
          // Show table mode toggle if unlocked
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle && items.tableModeUnlocked) {
            modeToggle.classList.add('visible');
        }
    });

    // Handle tab clicks
    function handleTabClick(event) {
        const button = event.currentTarget;
        saveCurrentNoteContent();
        // Clear active class from all tabs, including dynamically added ones
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
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
            // Decrypt after loading
            let content = result[key] || '';
            content = content ? decrypt(content) : '';
            noteContent.innerHTML = content.replace(/\n/g, '<br>');
            updateWordCount();
        });
    }

    // Save content for the current note
    function saveCurrentNoteContent() {
        const key = `textAreaContent_${currentNote}`;
        // Encrypt before saving
        chrome.storage.sync.set({ [key]: encrypt(noteContent.innerHTML) });
    }

    // Load content for the single note
    function loadSingleNoteContent() {
        const key = 'textAreaContent';
        chrome.storage.sync.get([key], (result) => {
            let content = result[key] || '';
            content = content ? decrypt(content) : '';
            noteContent.innerHTML = content.replace(/\n/g, '<br>');
            updateWordCount();
        });
    }

    // Save content for the single note
    function saveSingleNoteContent() {
        const key = 'textAreaContent';
        chrome.storage.sync.set({ [key]: encrypt(noteContent.innerHTML) });
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
        // Determine export content and format
        let dataStr, mimeType, fileName;
        if (toggleTableMode.checked) {
            // CSV export for table mode
            const table = spreadsheetContainer.querySelector('table');
            const rows = table ? Array.from(table.rows) : [];
            dataStr = rows.map(row => {
                return Array.from(row.cells).map(cell => {
                    let txt = cell.innerText.trim();
                    // Escape double quotes
                    if (txt.includes('"')) txt = txt.replace(/"/g, '""');
                    // Wrap in quotes if needed
                    if (/[,"]/.test(txt)) txt = `"${txt}"`;
                    return txt;
                }).join(',');
            }).join('\n');
            mimeType = 'text/csv';
            fileName = 'table.csv';
        } else {
            // Plain text export for notes
            dataStr = noteContent.innerText;
            mimeType = 'text/plain';
            if (enableTabs) fileName = `${currentNote}.txt`;
            else fileName = 'note.txt';
        }
        // Create and trigger download
        const blob = new Blob([dataStr], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });    // Word Count Function
    function updateWordCount() {
        if (wordCount.style.display === 'none') return;
        const text = noteContent.innerText.trim(); // Use innerText for plain text
        const words = text ? text.split(/\s+/).length : 0;
        wordCount.textContent = `Words: ${words}`;
    }
    function setActiveTabButton() {
        // Get all current tab buttons instead of using the initial tabButtons NodeList
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        const activeTabButton = document.querySelector(`.tab-button[data-note="${currentNote}"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('active');
        }
    }

    // Listen for messages to update tab names or add text to notes
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'addTextToNote') {
            const noteId = request.noteId;
            const key = noteId === 'singleNote' ? 'textAreaContent' : `textAreaContent_${noteId}`;
            chrome.storage.sync.get([key], (result) => {
                let existingContent = result[key] || '';
                existingContent = existingContent ? decrypt(existingContent) : '';
                const newContent = existingContent + request.selectedText;
                chrome.storage.sync.set({ [key]: encrypt(newContent) }, () => {
                    if (enableTabs) {
                        currentNote = noteId;
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

    // Listen for unlock message
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'unlockTableMode') {
            const modeToggle = document.getElementById('modeToggle');
            if (modeToggle) {
                modeToggle.classList.add('visible');
            }
        }
        if (request.action === 'addTextToNote') {
            // Only update if we're on the correct note tab
            if (currentNote === request.noteId) {
                // Append the new text to the note content
                noteContent.innerHTML += request.selectedText;
                updateWordCount(); // Update word count if it's enabled
            }
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
    let animationFrameId = null;

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

        // Cancel any pending animation frame to prevent stacking
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Schedule resize with reduced sensitivity for smoother experience
        animationFrameId = requestAnimationFrame(() => {
            // Calculate the change in mouse position
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // Adjust the width and height with reduced sensitivity factors
            const width = startWidth - (deltaX * 0.3); // Lower factor for smoother resizing
            const height = startHeight + (deltaY * 0.3); // Lower factor for smoother resizing

            // Apply the new dimensions to the popup (only if they've changed significantly)
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                popupBody.style.width = width + 'px';
                popupBody.style.height = height + 'px';
            }
            
            animationFrameId = null;
        });
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
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

    toggleTableMode.addEventListener('change', (e) => {
        console.log("Table mode toggled:", e.target.checked);
        // Update export button label when toggling modes
        exportButton.textContent = e.target.checked ? 'Export CSV' : 'Export TXT';
        
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
            
            // Adjust popup width for table mode to provide more space for the table
            const currentWidth = parseInt(document.defaultView.getComputedStyle(popupBody).width, 10);
            if (currentWidth < 400) {
                popupBody.style.width = '400px';
            }
            
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

            // Set a visual indicator for the scrollable area if there's overflow
            setTimeout(() => {
                if (spreadsheetContainer.scrollWidth > spreadsheetContainer.clientWidth) {
                    spreadsheetContainer.style.boxShadow = 'inset -10px 0 5px -6px rgba(0,0,0,0.15)';
                }
            }, 200);
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

            // Reset any table-specific styling
            spreadsheetContainer.style.boxShadow = '';
        }
        
        // Save the new table mode setting
        chrome.storage.sync.set({ 'tableMode': e.target.checked });
    });

    // Update the spreadsheetContainer paste event listener
    spreadsheetContainer.addEventListener('paste', (e) => {
        handleTablePaste(e, spreadsheetContainer);
    });
    // Enhance spreadsheet container for better horizontal scrolling
    spreadsheetContainer.addEventListener('scroll', () => {
        if (spreadsheetContainer.scrollLeft > 0) {
            spreadsheetContainer.style.boxShadow = 'inset -10px 0 5px -6px rgba(0,0,0,0.15), inset 10px 0 5px -6px rgba(0,0,0,0.15)';
        } else {
            spreadsheetContainer.style.boxShadow = 'inset -10px 0 5px -6px rgba(0,0,0,0.15)';
        }
    });

    chrome.storage.onChanged.addListener((changes) => {
        if (changes.darkMode && toggleTableMode.checked) {
            const isDarkMode = changes.darkMode.newValue;
            updateTableCellStyles(isDarkMode);
        }
        
        // Add this block to listen for showStylingButtons changes
        if (changes.showStylingButtons && !toggleTableMode.checked) {
            console.log("Styling buttons setting changed to:", changes.showStylingButtons.newValue);
            stylingButtonsContainer.style.display = changes.showStylingButtons.newValue ? 'block' : 'none';
        }
    });

    chrome.storage.onChanged.addListener((changes) => {
        if (changes.showStylingButtons) {
            console.log("showStylingButtons changed:", changes.showStylingButtons.newValue);
            if (!toggleTableMode.checked) {
                stylingButtonsContainer.style.display = changes.showStylingButtons.newValue ? 'block' : 'none';
                console.log("Styling buttons visibility updated to:", stylingButtonsContainer.style.display);
            }
        }
    });

    let clickCounter = 0;
    let lastClickTime = 0;
    const CLICK_TIMEOUT = 5000; // 2 seconds timeout
    const REQUIRED_CLICKS = 5;
    
    // Function to handle h2.bmc clicks
    function handleBmcClick() {
        const currentTime = Date.now();
        if (currentTime - lastClickTime > CLICK_TIMEOUT) {
            // Reset counter if too much time has passed
            clickCounter = 1;
        } else {
            clickCounter++;
        }
        lastClickTime = currentTime;

        if (clickCounter === REQUIRED_CLICKS) {
            // Show the mode toggle when click count reached
            const modeToggle = document.getElementById('modeToggle');
            if (modeToggle) {
                modeToggle.classList.add('visible');
                chrome.storage.sync.set({ 'tableModeUnlocked': true });
            }
            
            // Show a brief message that the feature was unlocked
            const easterEggMessage = document.createElement('div');
            easterEggMessage.textContent = ' You found a hidden feature! Table Mode has been unlocked.';
            easterEggMessage.style.padding = '10px';
            easterEggMessage.style.marginTop = '10px';
            easterEggMessage.style.backgroundColor = body.dataset.theme === 'dark' ? '#2a4d7a' : '#f0f8ff';
            easterEggMessage.style.color = body.dataset.theme === 'dark' ? '#fff' : '#000';
            easterEggMessage.style.borderRadius = '5px';
            easterEggMessage.style.transition = 'opacity 2s';
            easterEggMessage.style.textAlign = 'center';
            easterEggMessage.style.fontWeight = 'bold';
            easterEggMessage.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            
            // Add message to the DOM, just after the modeToggle
            if (modeToggle.parentNode) {
                modeToggle.parentNode.insertBefore(easterEggMessage, modeToggle.nextSibling);
            }
            
            // Fade out and remove after 5 seconds
            setTimeout(() => {
                easterEggMessage.style.opacity = '0';
                setTimeout(() => {
                    if (easterEggMessage.parentNode) {
                        easterEggMessage.parentNode.removeChild(easterEggMessage);
                    }
                }, 2000);
            }, 5000);
            
            clickCounter = 0; // Reset counter
        }
    }

    // Add click event listeners to h2.bmc elements
    document.querySelectorAll('h2.bmc').forEach(element => {
        element.addEventListener('click', handleBmcClick);
    });

    // Add click listeners to all h2.bmc elements in options page
    chrome.storage.sync.get('tableModeUnlocked', (items) => {
        if (items.tableModeUnlocked) {
            const modeToggle = document.getElementById('modeToggle');
            if (modeToggle) {
                modeToggle.classList.add('visible');
            }
        }
    });

    // Helper to assign the lowest available note number (reuses gaps after deletions)
function getNextNoteNumber() {
    const usedNumbers = Array.from(document.querySelectorAll('.tab-button[data-note]'))
        .map(btn => parseInt(btn.getAttribute('data-note').replace('note', ''), 10))
        .filter(n => !isNaN(n) && n > 3);
    let i = 4;
    while (usedNumbers.includes(i)) {
        i++;
    }
    return i;
}

    // Add a new note tab
    function addNewNote() {
        if (toggleTableMode.checked) {
            alert("Please disable Table Mode before adding new notes");
            return;
        }

        // Determine next available note number (reuse deleted slots)
        const num = getNextNoteNumber();
        const newNoteId = `note${num}`;
        const noteName = `Note ${num}`;
        
        // Save the current content before switching
        saveCurrentNoteContent();
        
        // Create new tab button
        const newTabButton = document.createElement('button');
        newTabButton.className = 'tab-button';
        newTabButton.setAttribute('data-note', newNoteId);
        newTabButton.textContent = noteName;
        
        // Add a delete icon inside the tab button
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fas fa-times delete-note-icon';
        deleteIcon.setAttribute('title', 'Delete this note');
        deleteIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent tab activation when clicking delete
            deleteNote(newNoteId);
        });
        newTabButton.appendChild(deleteIcon);
        
        // Add the new tab before the "Add Note" button
        tabContainer.insertBefore(newTabButton, addNoteButton);
        
        // Add event listener to the new tab
        newTabButton.addEventListener('click', handleTabClick);
        
        // Switch to the new tab
        // Clear active class from all tabs for consistent behavior
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        newTabButton.classList.add('active');
        currentNote = newNoteId;
        
        // Create empty content for the new tab
        noteContent.innerHTML = '';
        updateWordCount();
        
        // Save the new note name to storage
        chrome.storage.sync.set({ 
            [`${newNoteId}Name`]: noteName,
            'lastActiveTab': newNoteId
        });
        
        // Add delete icons to all existing tabs if they don't have one
        addDeleteIconsToTabs();
        
        // Ensure only one .active class is present (fix for rare DOM timing issues)
        setTimeout(() => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            newTabButton.classList.add('active');
        }, 0);
    }
    
    // Add delete icons to all tab buttons
    function addDeleteIconsToTabs() {
        // Skip for the first three default tabs to keep them permanent
        document.querySelectorAll('.tab-button[data-note^="note"]').forEach(tab => {
            const noteId = tab.getAttribute('data-note');
            // Only add delete icons to custom notes (note4 and higher)
            if (parseInt(noteId.replace('note', '')) > 3 && !tab.querySelector('.delete-note-icon')) {
                const deleteIcon = document.createElement('i');
                deleteIcon.className = 'fas fa-times delete-note-icon';
                deleteIcon.setAttribute('title', 'Delete this note');
                deleteIcon.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent tab activation
                    deleteNote(noteId);
                });
                tab.appendChild(deleteIcon);
            }
        });
    }
    
    // Delete a note
    function deleteNote(noteId) {
        // Create confirmation dialog
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog';
        dialog.innerHTML = `
            <p>Are you sure you want to delete this note?</p>
            <p>This action cannot be undone.</p>
            <div class="confirmation-buttons">
                <button class="confirm-yes">Yes, delete it</button>
                <button class="confirm-no">Cancel</button>
            </div>
        `;
        document.body.appendChild(dialog);
        dialog.style.display = 'block';
        
        // Handle confirmation button clicks
        dialog.querySelector('.confirm-yes').addEventListener('click', () => {
            // Find the tab to remove
            const tabToRemove = document.querySelector(`.tab-button[data-note="${noteId}"]`);
            
            // If this is the active tab, switch to another tab first
            if (currentNote === noteId) {
                // Find the previous tab or the first tab if no previous tab
                const previousTab = tabToRemove.previousElementSibling;
                const nextTab = tabToRemove.nextElementSibling;
                
                let newActiveTab;
                if (previousTab && previousTab.classList.contains('tab-button')) {
                    newActiveTab = previousTab;
                } else if (nextTab && nextTab.classList.contains('tab-button')) {
                    newActiveTab = nextTab;
                } else {
                    // Default to first tab
                    newActiveTab = document.querySelector('.tab-button[data-note="note1"]');
                }
                
                // Activate the new tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                newActiveTab.classList.add('active');
                currentNote = newActiveTab.getAttribute('data-note');
                loadCurrentNoteContent();
                chrome.storage.sync.set({ 'lastActiveTab': currentNote });
            }
            
            // Remove the tab from DOM
            tabContainer.removeChild(tabToRemove);
            
            // Delete the note data from storage
            chrome.storage.sync.remove([
                `textAreaContent_${noteId}`,
                `${noteId}Name`
            ]);
            chrome.storage.local.remove([
                `tableContent_${noteId}`
            ]);
            
            // Remove the dialog
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.confirm-no').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }
    
    // Restore custom notes (beyond the default 3)
    function restoreCustomNotes() {
        return new Promise(resolve => {
            // Get all storage keys to find custom notes
            chrome.storage.sync.get(null, items => {
                // Look for note names beyond the default 3
                const noteNameKeys = Object.keys(items).filter(key => key.match(/^note\d+Name$/) && !['note1Name', 'note2Name', 'note3Name'].includes(key));
                
                // Extract note IDs from key names and convert to numbers
                const customNoteIds = noteNameKeys.map(key => {
                    const id = key.replace('Name', '');
                    return { id, number: parseInt(id.replace('note', ''), 10) };
                });
                
                // Sort by note number
                customNoteIds.sort((a, b) => a.number - b.number);
                
                // Update the highest note count
                if (customNoteIds.length > 0) {
                    noteCount = Math.max(noteCount, customNoteIds[customNoteIds.length - 1].number);
                }
                
                // Create tabs for each custom note
                customNoteIds.forEach(({id}) => {
                    const noteName = items[`${id}Name`];
                    // Skip if this custom tab already exists
                    if (document.querySelector(`.tab-button[data-note="${id}"]`)) return;
                    // Create new tab button
                    const newTabButton = document.createElement('button');
                    newTabButton.className = 'tab-button';
                    newTabButton.setAttribute('data-note', id);
                    newTabButton.textContent = noteName;
                    
                    // Add a delete icon
                    const deleteIcon = document.createElement('i');
                    deleteIcon.className = 'fas fa-times delete-note-icon';
                    deleteIcon.setAttribute('title', 'Delete this note');
                    deleteIcon.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent tab activation
                        deleteNote(id);
                    });
                    newTabButton.appendChild(deleteIcon);
                    
                    // Add the new tab before the "Add Note" button
                    tabContainer.insertBefore(newTabButton, addNoteButton);
                    
                    // Add event listener to the new tab
                    newTabButton.addEventListener('click', handleTabClick);
                });
                resolve();
            });
        });
    }

    // Handle clicking the "Add Note" button
    if (addNoteButton) {
        addNoteButton.addEventListener('click', addNewNote);
    }
});

