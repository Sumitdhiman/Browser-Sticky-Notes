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
    const showWordCountCheckbox = document.getElementById('showWordCount');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const darkModeMessage = document.getElementById('darkModeMessage');

    // Rename notes elements
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

    let selectedColor = '#F5F5DC'; // Default color
    let selectedBackgroundColor = '#F8F8FF'; // Default background color
    let currentTheme = 'light'; // Default theme

    // Load saved preferences
    chrome.storage.sync.get({
        'showExportButton': false,
        'enableTabs': true,
        'textAreaBgColor': selectedColor,
        'backgroundColor': selectedBackgroundColor,
        'useLargeFont': false,
        'showWordCount': true,
        'note1Name': 'Note 1',
        'note2Name': 'Note 2',
        'note3Name': 'Note 3',
        'darkMode': false
    }, (items) => {
        showExportCheckbox.checked = items.showExportButton;
        enableTabsCheckbox.checked = items.enableTabs;
        useLargeFontCheckbox.checked = items.useLargeFont;
        showWordCountCheckbox.checked = items.showWordCount;
        selectedColor = items.textAreaBgColor;
        selectedBackgroundColor = items.backgroundColor;
        note1NameInput.value = items.note1Name;
        note2NameInput.value = items.note2Name;
        note3NameInput.value = items.note3Name;
        darkModeToggle.checked = items.darkMode;
        currentTheme = items.darkMode ? 'dark' : 'light';
        applyTheme();
        renderPalettes();
        updateDarkModeMessage(); // Initial message update
    });

    // Event listeners for checkboxes
    showExportCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'showExportButton': showExportCheckbox.checked });
    });

    enableTabsCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'enableTabs': enableTabsCheckbox.checked });
    });

    useLargeFontCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'useLargeFont': useLargeFontCheckbox.checked });
    });

    showWordCountCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'showWordCount': showWordCountCheckbox.checked });
    });

    darkModeToggle.addEventListener('change', () => {
        currentTheme = darkModeToggle.checked ? 'dark' : 'light';
        chrome.storage.sync.set({ 'darkMode': darkModeToggle.checked });
        applyTheme();
        updateDarkModeMessage(); // Update message on toggle
    });

    function renderPalettes() {
        // Render note color palette
        colorPalette.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const color = pastelColors[i] || '#ffffff'; // Use white if color is not defined
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
        for (let i = 0; i < 16; i++) {
            const color = pastelColors[i] || '#ffffff'; // Use white if color is not defined
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
            setTimeout(() => { statusDiv.textContent = ''; }, 1500);
        });
    });

    saveBackgroundButton.addEventListener('click', () => {
        chrome.storage.sync.set({ backgroundColor: selectedBackgroundColor }, () => {
            backgroundStatusDiv.textContent = 'Background color saved!';
            setTimeout(() => { backgroundStatusDiv.textContent = ''; }, 1500);
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
            setTimeout(() => { renameStatusDiv.textContent = ''; }, 1500);
            updateTabNamesInPopup();
        });
    });

    function updateTabNamesInPopup() {
        // Check if there's an active popup window
        chrome.runtime.getViews({ type: "popup" }, (views) => {
            if (views.length > 0) {
                chrome.runtime.sendMessage({
                    action: 'updateTabNames',
                    note1Name: note1NameInput.value.trim() || 'Note 1',
                    note2Name: note2NameInput.value.trim() || 'Note 2',
                    note3Name: note3NameInput.value.trim() || 'Note 3'
                });
            }
        });
    }

    function applyTheme() {
        body.dataset.theme = currentTheme;
    }

    function updateDarkModeMessage() {
        darkModeMessage.style.display = darkModeToggle.checked ? 'block' : 'none';
    }
    
});