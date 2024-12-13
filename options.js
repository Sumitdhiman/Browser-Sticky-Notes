document.addEventListener('DOMContentLoaded', () => {
    const colorPalette = document.getElementById('colorPalette');
    const saveButton = document.getElementById('saveButton');
    const statusDiv = document.getElementById('status');
    const showExportCheckbox = document.getElementById('showExport');
    const enableTabsCheckbox = document.getElementById('enableTabs');
    const useLargeFontCheckbox = document.getElementById('useLargeFont');
    const showWordCountCheckbox = document.getElementById('showWordCount');

    // Rename notes
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

    // Load saved preferences
    chrome.storage.sync.get({
        'showExportButton': false,
        'enableTabs': true,
        'textAreaBgColor': selectedColor,
        'useLargeFont': false,
        'showWordCount': true,
        'note1Name': 'Note 1',
        'note2Name': 'Note 2',
        'note3Name': 'Note 3'
    }, (items) => {
        showExportCheckbox.checked = items.showExportButton;
        enableTabsCheckbox.checked = items.enableTabs;
        useLargeFontCheckbox.checked = items.useLargeFont;
        showWordCountCheckbox.checked = items.showWordCount;
        selectedColor = items.textAreaBgColor || selectedColor;
        note1NameInput.value = items.note1Name;
        note2NameInput.value = items.note2Name;
        note3NameInput.value = items.note3Name;
        renderPalette();
    });

    // Save preference when "Show Export Button" checkbox changes
    showExportCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'showExportButton': showExportCheckbox.checked });
    });

    // Save preference when "Enable Tabs" checkbox changes
    enableTabsCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'enableTabs': enableTabsCheckbox.checked });
    });

    // Save preference when "Use Large Font" checkbox changes
    useLargeFontCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'useLargeFont': useLargeFontCheckbox.checked });
    });

    // Save preference when "Show Word Count" checkbox changes
    showWordCountCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'showWordCount': showWordCountCheckbox.checked });
    });

    function renderPalette() {
        colorPalette.innerHTML = '';
        pastelColors.forEach(color => {
            const colorBox = document.createElement('div');
            colorBox.classList.add('color-box');
            colorBox.style.backgroundColor = color;
            colorBox.title = color;

            if (color === selectedColor) {
                colorBox.classList.add('selected');
            }

            colorBox.addEventListener('click', () => {
                document.querySelectorAll('.color-box').forEach(box => box.classList.remove('selected'));
                colorBox.classList.add('selected');
                selectedColor = color;
            });
            colorPalette.appendChild(colorBox);
        });
    }

    saveButton.addEventListener('click', () => {
        chrome.storage.sync.set({ textAreaBgColor: selectedColor }, () => {
            statusDiv.textContent = 'Nice color! Settings saved!';
            setTimeout(() => { statusDiv.textContent = ''; }, 1500);
        });
    });

    // Rename Notes Logic
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
            // Update tab names in the popup if it's open
            updateTabNamesInPopup();
        });
    });

    // Function to update tab names in the popup
    function updateTabNamesInPopup() {
        chrome.runtime.sendMessage({
            action: 'updateTabNames',
            note1Name: note1NameInput.value.trim() || 'Note 1',
            note2Name: note2NameInput.value.trim() || 'Note 2',
            note3Name: note3NameInput.value.trim() || 'Note 3'
        });
    }
});