document.addEventListener('DOMContentLoaded', () => {
    const colorPalette = document.getElementById('colorPalette');
    const backgroundColorPalette = document.getElementById('backgroundColorPalette');
    const saveButton = document.getElementById('saveButton');
    const saveBackgroundButton = document.getElementById('saveBackgroundButton');
    const statusDiv = document.getElementById('status');
    const backgroundStatusDiv = document.getElementById('backgroundStatus');
    const showExportCheckbox = document.getElementById('showExport');
    const enableTabsCheckbox = document.getElementById('enableTabs');
    const useLargeFontCheckbox = document.getElementById('useLargeFont');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const showStylingButtonsCheckbox = document.getElementById('showStylingButtons');
    const notifyWhenContextAddCheckbox = document.getElementById('notifywhencontextadd');
    const hideTableModeToggleCheckbox = document.getElementById('tableMode');
    const showSiteNoteButtonCheckbox = document.getElementById('showSiteNoteButton');
    const note1NameInput = document.getElementById('note1Name');
    const note2NameInput = document.getElementById('note2Name');
    const note3NameInput = document.getElementById('note3Name');
    const renameButton = document.getElementById('renameButton');
    const renameStatusDiv = document.getElementById('renameStatus');

    const pastelColors = [
        '#FFE4E1', '#F0FFF0', '#F0F8FF', '#F5F5DC', '#FFF0F5',
        '#E6E6FA', '#F0FFFF', '#FFF5EE', '#F5FFFA', '#FAFAD2',
        '#E0FFFF', '#FFE4B5', '#F8F8FF', '#FFF8DC', '#FFFACD'
    ];

    let selectedColor = '#E0FFFF'; // Updated default note color
    let selectedBackgroundColor = 'var(--cs-site-background)'; // Updated default background color
    let currentTheme = 'light'; // Default theme

    // Load saved preferences
    chrome.storage.sync.get({
        'showExportButton': false,
        'enableTabs': true,
        'textAreaBgColor': selectedColor, // Use updated default
        'backgroundColor': selectedBackgroundColor, // Use updated default
        'useLargeFont': false,
        'note1Name': 'Note 1',
        'note2Name': 'Note 2',
        'note3Name': 'Note 3',
        'darkMode': false,
        'tableMode': false,
        'tableModeUnlocked': false
    }, (items) => {
        showExportCheckbox.checked = items.showExportButton;
        enableTabsCheckbox.checked = items.enableTabs;
        useLargeFontCheckbox.checked = items.useLargeFont;
        selectedColor = items.textAreaBgColor;
        selectedBackgroundColor = items.backgroundColor;
        note1NameInput.value = items.note1Name;
        note2NameInput.value = items.note2Name;
        note3NameInput.value = items.note3Name;
        darkModeToggle.checked = items.darkMode;
        currentTheme = items.darkMode ? 'dark' : 'light';
        applyTheme();
        renderPalettes();
        hideTableModeToggleCheckbox.checked = items.tableMode;
        
        // Show table mode toggle if it's been unlocked
        if (items.tableModeUnlocked) {
            const tableModeRow = hideTableModeToggleCheckbox.closest('.option-row');
            if (tableModeRow) {
                tableModeRow.style.display = 'flex';
            }
        }
    });

    // Event listeners for checkboxes
    // After saving showExportButton preference, ensure popup.js reads it
    showExportCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'showExportButton': showExportCheckbox.checked });
    });

    enableTabsCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'enableTabs': enableTabsCheckbox.checked });
    });

    useLargeFontCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'useLargeFont': useLargeFontCheckbox.checked });
    });

    darkModeToggle.addEventListener('change', () => {
        currentTheme = darkModeToggle.checked ? 'dark' : 'light';
        chrome.storage.sync.set({ 'darkMode': darkModeToggle.checked });
        applyTheme();
    });

    function renderPalettes() {
        // Render note color palette
        colorPalette.innerHTML = '';
        for (let i = 0; i < 15; i++) {
            const color = pastelColors[i];
            const colorBox = document.createElement('div');
            colorBox.classList.add('color-box');
            colorBox.style.backgroundColor = color;
            colorBox.title = color;

            if (color === selectedColor) {
                colorBox.classList.add('selected');
            }

            colorBox.addEventListener('click', () => {
                document.querySelectorAll('#colorPalette .color-box').forEach(box =>
                    box.classList.remove('selected'));
                colorBox.classList.add('selected');
                selectedColor = color;
            });
            colorPalette.appendChild(colorBox);
        }

        // Render background color palette
        backgroundColorPalette.innerHTML = '';
        for (let i = 0; i < 15; i++) {
            const color = pastelColors[i];
            const colorBox = document.createElement('div');
            colorBox.classList.add('color-box');
            colorBox.style.backgroundColor = color;
            colorBox.title = color;

            if (color === selectedBackgroundColor) {
                colorBox.classList.add('selected');
            }

            colorBox.addEventListener('click', () => {
                document.querySelectorAll('#backgroundColorPalette .color-box').forEach(box =>
                    box.classList.remove('selected'));
                colorBox.classList.add('selected');
                selectedBackgroundColor = color;
            });
            backgroundColorPalette.appendChild(colorBox);
        }
    }

    // Save buttons event listeners
    saveButton.addEventListener('click', () => {
        chrome.storage.sync.set({ textAreaBgColor: selectedColor }, () => {
            statusDiv.textContent = 'Nice color! Settings saved!';
            statusDiv.classList.add('show');
            setTimeout(() => { 
                statusDiv.classList.remove('show');
                setTimeout(() => { statusDiv.textContent = ''; }, 300);
            }, 1500);
        });
    });

    saveBackgroundButton.addEventListener('click', () => {
        chrome.storage.sync.set({ backgroundColor: selectedBackgroundColor }, () => {
            backgroundStatusDiv.textContent = 'Background color saved!';
            backgroundStatusDiv.classList.add('show');
            setTimeout(() => { 
                backgroundStatusDiv.classList.remove('show');
                setTimeout(() => { backgroundStatusDiv.textContent = ''; }, 300);
            }, 1500);
        });
    });

    // Rename notes logic
    renameButton.addEventListener('click', () => {
        const note1Name = note1NameInput.value.trim() || 'Note 1';
        const note2Name = note2NameInput.value.trim() || 'Note 2';
        const note3Name = note3NameInput.value.trim() || 'Note 3';

        chrome.storage.sync.set({
            'note1Name': note1Name,
            'note2Name': note2Name,
            'note3Name': note3Name
        }, () => {
            renameStatusDiv.textContent = 'Note names updated!';
            renameStatusDiv.classList.add('show');
            setTimeout(() => { 
                renameStatusDiv.classList.remove('show');
                setTimeout(() => { renameStatusDiv.textContent = ''; }, 300);
            }, 1500);
            updateTabNamesInPopup();
        });
    });

    function updateTabNamesInPopup() {
        // Send message to update tab names in popup (if open)
        chrome.runtime.sendMessage({
            action: 'updateTabNames',
            note1Name: note1NameInput.value.trim() || 'Note 1',
            note2Name: note2NameInput.value.trim() || 'Note 2',
            note3Name: note3NameInput.value.trim() || 'Note 3'
        }, (response) => {
            // Ignore errors if popup is not open
            if (chrome.runtime.lastError) {
                // Popup not open, which is fine
            }
        });
    }

    function applyTheme() {
        body.dataset.theme = currentTheme;
    }
    
    chrome.storage.sync.get({
        'showStylingButtons': true // Default to true if not set
    }, (items) => {
        showStylingButtonsCheckbox.checked = items.showStylingButtons;
    });
    
    // Save preference on change
    showStylingButtonsCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'showStylingButtons': showStylingButtonsCheckbox.checked });
    });

    chrome.storage.sync.get({
        'showSiteNoteButton': false // Default to false if not set
    }, (items) => {
        showSiteNoteButtonCheckbox.checked = items.showSiteNoteButton;
    });
    
    // Save preference on change
    showSiteNoteButtonCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'showSiteNoteButton': showSiteNoteButtonCheckbox.checked });
    });

    chrome.storage.sync.get({
        'notifywhencontextadd': true // Default to true if not set
    }, (items) => {
        notifyWhenContextAddCheckbox.checked = items.notifywhencontextadd;
    });
    
    // Save preference on change
    notifyWhenContextAddCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'notifywhencontextadd': notifyWhenContextAddCheckbox.checked });
    });

    // Save setting whenever the checkbox value changes.
    hideTableModeToggleCheckbox.addEventListener('change', (e) => {
        chrome.storage.sync.set({ 'tableMode': e.target.checked });
    });

    let clickCounter = 0;
    let lastClickTime = 0;
    const CLICK_TIMEOUT = 2000; // 2 seconds timeout
    const REQUIRED_CLICKS = 5;

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
            chrome.storage.sync.set({ 'tableModeUnlocked': true });
            clickCounter = 0; // Reset counter

            // Update UI to show table mode is unlocked
            const tableModeToggle = document.getElementById('tableMode');
            if (tableModeToggle) {
                tableModeToggle.parentElement.parentElement.style.display = 'flex';
            }

            // Show a brief message that the feature was unlocked
            const easterEggMessage = document.createElement('div');
            easterEggMessage.textContent = 'You found a hidden feature! Table Mode on the popup has been unlocked.';
            easterEggMessage.style.padding = '10px';
            easterEggMessage.style.marginTop = '10px';
            easterEggMessage.style.backgroundColor = currentTheme === 'dark' ? '#2a4d7a' : '#f0f8ff';
            easterEggMessage.style.color = currentTheme === 'dark' ? '#fff' : '#000';
            easterEggMessage.style.borderRadius = '5px';
            easterEggMessage.style.transition = 'opacity 2s';
            easterEggMessage.style.textAlign = 'center';
            easterEggMessage.style.fontWeight = 'bold';

            // Add message to the DOM
            const settingsSection = document.querySelector('.settings');
            if (settingsSection) {
                settingsSection.appendChild(easterEggMessage);
                
                // Fade out and remove after 5 seconds
                setTimeout(() => {
                    easterEggMessage.style.opacity = '0';
                    setTimeout(() => {
                        if (easterEggMessage.parentNode) {
                            easterEggMessage.parentNode.removeChild(easterEggMessage);
                        }
                    }, 2000);
                }, 5000);
            }

            // Notify any open popups
            chrome.runtime.sendMessage({ action: 'unlockTableMode' });
        }
    }

    // Set up easter egg click handlers for h2.bmc elements
    document.querySelectorAll('h2.bmc').forEach(heading => {
        heading.addEventListener('click', handleBmcClick);
    });

    // Export All Data
    const exportAllButton = document.getElementById('exportAllButton');
    const importButton = document.getElementById('importButton');
    const importFileInput = document.getElementById('importFileInput');
    const importStatus = document.getElementById('importStatus');

    exportAllButton.addEventListener('click', () => {
        // Gather all sync and local storage data
        chrome.storage.sync.get(null, syncItems => {
            chrome.storage.local.get(null, localItems => {
                const data = { sync: syncItems, local: localItems };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sticky_notes_backup.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        });
    });

    // Trigger file picker
    importButton.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', event => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (data.sync && data.local) {
                    chrome.storage.sync.set(data.sync, () => {
                        chrome.storage.local.set(data.local, () => {
                            importStatus.textContent = 'Import successful!';
                            importStatus.classList.add('show');
                            setTimeout(() => { importStatus.classList.remove('show'); }, 2000);
                            // reload page to reflect settings
                            window.location.reload();
                        });
                    });
                } else {
                    importStatus.textContent = 'Invalid backup file.';
                    importStatus.classList.add('show');
                    setTimeout(() => { importStatus.classList.remove('show'); }, 2000);
                }
            } catch (e) {
                importStatus.textContent = 'Error parsing file.';
                importStatus.classList.add('show');
                setTimeout(() => { importStatus.classList.remove('show'); }, 2000);
            }
        };
        reader.readAsText(file);
    });
});
