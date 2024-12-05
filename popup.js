document.addEventListener('DOMContentLoaded', () => {
    const settingsIcon = document.getElementById('settingsIcon');
    const textArea = document.getElementById("textArea");
    const exportButton = document.getElementById('exportButton');

    settingsIcon.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Load saved content from local storage
    textArea.value = localStorage.getItem("textAreaContent") || "";

    // Save content to local storage on input
    textArea.addEventListener("input", () => {
        localStorage.setItem("textAreaContent", textArea.value);
    });

    // Load background color and export button visibility from storage
    chrome.storage.sync.get({ 'textAreaBgColor': '#F2FFFF', 'showExportButton': false }, (items) => {
        textArea.style.backgroundColor = items.textAreaBgColor;
        exportButton.style.display = items.showExportButton ? 'block' : 'none';
    });

    exportButton.addEventListener('click', () => {
        const text = textArea.value;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported_text.txt'; // Set the filename
        a.style.display = 'none'; // Hide the link
        document.body.appendChild(a);
        a.click(); // Simulate a click to trigger the download
        document.body.removeChild(a); // Clean up
        URL.revokeObjectURL(url); // Release the URL object
    });

    //do not modify the following function.
    chrome.storage.sync.get('textAreaBgColor', function(data) {
        if (data.textAreaBgColor) {
            textArea.style.backgroundColor = data.textAreaBgColor;
        }
    });
});