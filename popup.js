document.addEventListener('DOMContentLoaded', () => {
    const settingsIcon = document.getElementById('settingsIcon');
    const textArea = document.getElementById('textArea');
    const exportButton = document.getElementById('exportButton');
    const wordCount = document.getElementById('wordCount');
    const tabContainer = document.querySelector('.tab-container');
    const tabButtons = document.querySelectorAll('.tab-button');
    const popupBody = document.querySelector('.popup-body');
    const body = document.body; // Get the body element

    let currentNote = 'note1'; // Default note
    let enableTabs = true; // Default to true

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
        'backgroundColor': '#FFFFFF', // Default background color
        'darkMode': false // Load dark mode preference
    }, (items) => {
        textArea.style.backgroundColor = items.textAreaBgColor;
        exportButton.style.display = items.showExportButton ? 'block' : 'none';
        enableTabs = items.enableTabs;
        if (items.showWordCount) {
            wordCount.style.display = 'block';
            updateWordCount();
        } else {
            wordCount.style.display = 'none';
        }

        // Set font size based on preference
        if (items.useLargeFont) {
            textArea.style.fontSize = '18px'; // Or your preferred large font size
        } else {
            textArea.style.fontSize = '14px'; // Your default font size
        }

        if (enableTabs) {
            tabContainer.style.display = 'flex';
            // Update tab names
            tabButtons.forEach(button => {
                const noteId = button.getAttribute('data-note');
                button.textContent = items[`${noteId}Name`] || `Note ${noteId.slice(-1)}`;
            });
            setupTabs();
        } else {
            tabContainer.style.display = 'none';
            currentNote = 'singleNote';
            loadSingleNoteContent();
            tabButtons.forEach(button => {
                button.removeEventListener('click', handleTabClick);
            });
        }
        popupBody.style.backgroundColor = items.backgroundColor; // Set background color

        // Apply dark mode class
        body.dataset.theme = items.darkMode ? 'dark' : 'light';

        // Set background color based on dark mode
        if (items.darkMode) {
            popupBody.style.backgroundColor = '#444'; // Set dark mode background color
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
    }

    // Setup tabs
    function setupTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', handleTabClick);
        });
        loadCurrentNoteContent();
    }

    // Load content for the current note
    function loadCurrentNoteContent() {
        const key = `textAreaContent_${currentNote}`;
        chrome.storage.sync.get([key], (result) => {
            textArea.value = result[key] || '';
            updateWordCount();
        });
    }

    // Save content for the current note
    function saveCurrentNoteContent() {
        const key = `textAreaContent_${currentNote}`;
        chrome.storage.sync.set({ [key]: textArea.value });
    }

    // Load content for the single note
    function loadSingleNoteContent() {
        const key = 'textAreaContent';
        chrome.storage.sync.get([key], (result) => {
            textArea.value = result[key] || '';
            updateWordCount();
        });
    }

    // Save content for the single note
    function saveSingleNoteContent() {
        const key = 'textAreaContent';
        chrome.storage.sync.set({ [key]: textArea.value });
    }

    // Save content on input
    textArea.addEventListener('input', () => {
        if (enableTabs) {
            saveCurrentNoteContent();
        } else {
            saveSingleNoteContent();
        }
        updateWordCount();
    });

    // Export Button Click
    exportButton.addEventListener('click', () => {
        const text = textArea.value;
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
        const text = textArea.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        wordCount.textContent = `Words: ${words}`;
    }

    // Listen for messages from the options page to update tab names
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateTabNames') {
            tabButtons.forEach(button => {
                const noteId = button.getAttribute('data-note');
                button.textContent = request[`${noteId}Name`] || `Note ${noteId.slice(-1)}`;
            });
        }
        if (request.action === 'addTextToNewNote') {
            textArea.value = request.selectedText;
            if (enableTabs) {
                saveCurrentNoteContent();
            } else {
                saveSingleNoteContent();
            }
            updateWordCount();
        }
        if (request.action === 'addTextToSingleNote') {
            textArea.value = request.selectedText;
            if (enableTabs) {
                saveCurrentNoteContent();
            } else {
                saveSingleNoteContent();
            }
            updateWordCount();
        }
    });
});