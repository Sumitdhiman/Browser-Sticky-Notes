document.addEventListener('DOMContentLoaded', () => {
    const settingsIcon = document.getElementById('settingsIcon');
    const noteContent = document.getElementById('noteContent');
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

    let currentNote = 'note1';
    let enableTabs = true;

    settingsIcon.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
    
    // Load settings from storage
    chrome.storage.sync.get({
        'textAreaBgColor': '#F2FFFF',
        'showExportButton': false,
        'enableTabs': true,
        'showWordCount': true,
        'useLargeFont': false,
        'note1Name': 'Note 1',
        'note2Name': 'Note 2',
        'note3Name': 'Note 3',
        'backgroundColor': '#FFFFFF',
        'darkMode': false,
        'lastActiveTab': 'note1',
        'showStylingButtons': true // Load last active tab
    }, (items) => {
        noteContent.style.backgroundColor = items.textAreaBgColor;
        stylingButtonsContainer.style.display = items.showStylingButtons ? 'block' : 'none';
        exportButton.style.display = items.showExportButton ? 'block' : 'none';
        enableTabs = items.enableTabs;
        if (items.showWordCount) {
            wordCount.style.display = 'block';
            updateWordCount();
        } else {
            wordCount.style.display = 'none';
        }

        if (items.useLargeFont) {
            noteContent.style.fontSize = '18px';
        } else {
            noteContent.style.fontSize = '14px';
        }

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
            noteContent.innerHTML = result[key] || ''; // Use innerHTML to preserve formatting
            updateWordCount();
            updateButtonStates();
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
            noteContent.innerHTML = result[key] || ''; // Use innerHTML
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
        const text = noteContent.innerText; // Use innerText to get plain text
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        if (enableTabs) {
            a.download = `${currentNote}.txt`;
        } else {
            a.download = `note.txt`;
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
        if (request.action === 'updateTabNames') {
            tabButtons.forEach(button => {
                const noteId = button.getAttribute('data-note');
                button.textContent = request[`${noteId}Name`] || `Note ${noteId.slice(-1)}`;
            });
        } else if (request.action === 'addTextToNote') {
            // Ensure the note content is updated with any existing content before appending
            const noteId = request.noteId;
            const key = `textAreaContent_${noteId}`;
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

});