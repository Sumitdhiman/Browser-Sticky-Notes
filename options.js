document.addEventListener('DOMContentLoaded', () => {
    const colorPalette = document.getElementById('colorPalette');
    const saveButton = document.getElementById('saveButton');
    const statusDiv = document.getElementById('status');
    const showExportCheckbox = document.getElementById('showExport');
    const enableTabsCheckbox = document.getElementById('enableTabs'); // Checkbox for Tabs
    const useLargeFontCheckbox = document.getElementById('useLargeFont');
    const showWordCountCheckbox = document.getElementById('showWordCount'); // Checkbox for Word Count

    const pastelColors = [
        '#FFE4E1', '#F0FFF0', '#F0F8FF', '#F5F5DC', '#FFF0F5',
        '#E6E6FA', '#F0FFFF', '#FFF5EE', '#F5FFFA', '#FAFAD2',
        '#E0FFFF', '#FFE4B5', '#F8F8FF', '#FFF8DC', '#FFFACD'
    ];

    let selectedColor = '#F5F5DC'; // Default color

    // Load saved preferences
    chrome.storage.sync.get({
        'showExportButton': false,
        'enableTabs': true, // Default is true
        'textAreaBgColor': selectedColor, // Default color
        'useLargeFont': false,
        'showWordCount': true // Default is true
    }, (items) => {
        showExportCheckbox.checked = items.showExportButton;
        enableTabsCheckbox.checked = items.enableTabs;
        useLargeFontCheckbox.checked = items.useLargeFont;
        showWordCountCheckbox.checked = items.showWordCount; // Load Word Count preference
        selectedColor = items.textAreaBgColor || selectedColor;
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
            statusDiv.textContent = 'Color saved, Nice Choice!';
            setTimeout(() => { statusDiv.textContent = ''; }, 1500);
        });
    });
});