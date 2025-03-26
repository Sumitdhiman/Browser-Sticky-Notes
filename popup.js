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
        'tableModeUnlocked': false
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
});