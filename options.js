document.addEventListener('DOMContentLoaded', () => {
    const colorPalette = document.getElementById('colorPalette');
    const saveButton = document.getElementById('saveButton');
    const statusDiv = document.getElementById('status');
    const showExportCheckbox = document.getElementById('showExport');

    // Load saved preference
    chrome.storage.sync.get({ 'showExportButton': false }, (items) => {
        showExportCheckbox.checked = items.showExportButton;
    });

    // Save preference when checkbox changes
    showExportCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ 'showExportButton': showExportCheckbox.checked });
    });

    const pastelColors = [
        '#FFE4E1', '#F0FFF0', '#F0F8FF', '#F5F5DC', '#FFF0F5',
        '#E6E6FA', '#F0FFFF', '#FFF5EE', '#F5FFFA', '#FAFAD2',
        '#E0FFFF', '#FFE4B5', '#F8F8FF', '#FFF8DC', '#FFFACD'
    ];

    let selectedColor = '#F5F5DC'; // Default color

    // Load saved color from storage
    chrome.storage.sync.get('textAreaBgColor', function(data) {
        if (data.textAreaBgColor) {
            selectedColor = data.textAreaBgColor;
        }
        renderPalette();
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
            statusDiv.textContent = 'Color saved!';
            setTimeout(() => { statusDiv.textContent = ''; }, 1500);
        });
    });
});