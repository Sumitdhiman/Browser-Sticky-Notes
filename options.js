document.addEventListener('DOMContentLoaded', () => {
    const colorPalette = document.getElementById('colorPalette');
    const saveButton = document.getElementById('saveButton');
    const statusDiv = document.getElementById('status');
    const showExportCheckbox = document.getElementById('showExport');
    const showCopyCheckbox = document.getElementById('showCopy'); // New Copy Toggle

    const pastelColors = [
        '#FFE4E1', '#F0FFF0', '#F0F8FF', '#F5F5DC', '#FFF0F5',
        '#E6E6FA', '#F0FFFF', '#FFF5EE', '#F5FFFA', '#FAFAD2',
        '#E0FFFF', '#FFE4B5', '#F8F8FF', '#FFF8DC', '#FFFACD'
    ];

    let selectedColor = '#F5F5DC'; // Default color

    // Load saved preferences
    chrome.storage.sync.get({
        'showExportButton': false,
        'showCopyButton': false,  // New Preference
        'textAreaBgColor': selectedColor // Default color
    }, (items) => {
        showExportCheckbox.checked = items.showExportButton;
        showCopyCheckbox.checked = items.showCopyButton; // Load Copy Button Preference
        selectedColor = items.textAreaBgColor || selectedColor;
        renderPalette();
    });

    // Save preference when "Show Export Button" checkbox changes
    showExportCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'showExportButton': showExportCheckbox.checked });
    });

    // Save preference when "Show Copy Button" checkbox changes
    showCopyCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'showCopyButton': showCopyCheckbox.checked });
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
            statusDiv.textContent = 'Settings saved!';
            setTimeout(() => { statusDiv.textContent = ''; }, 1500);
        });
    });
	
	

 const useLargeFontCheckbox = document.getElementById('useLargeFont');

    // Load saved preferences
    chrome.storage.sync.get({
        // ... (Your existing preferences)
        'useLargeFont': false // Default font size
    }, (items) => {
        // ... (Your existing loading code)
        useLargeFontCheckbox.checked = items.useLargeFont;
    });

    // Save preference when "Use Large Font" checkbox changes
    useLargeFontCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'useLargeFont': useLargeFontCheckbox.checked });
    });
});