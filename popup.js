document.addEventListener('DOMContentLoaded', () => {
    const settingsIcon = document.getElementById('settingsIcon');
    const textArea = document.getElementById("textArea");
    const exportButton = document.getElementById('exportButton');
    const copyButton = document.getElementById('copyButton'); // New Copy Button

    settingsIcon.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Load saved content from local storage
    textArea.value = localStorage.getItem("textAreaContent") || "";

    // Save content to local storage on input
    textArea.addEventListener("input", () => {
        localStorage.setItem("textAreaContent", textArea.value);
    });

    // Load background color and button visibility from storage
    chrome.storage.sync.get({ 
        'textAreaBgColor': '#F2FFFF', 
        'showExportButton': false, 
        'showCopyButton': false  // New Preference
    }, (items) => {
        textArea.style.backgroundColor = items.textAreaBgColor;
        exportButton.style.display = items.showExportButton ? 'block' : 'none';
        copyButton.style.display = items.showCopyButton ? 'block' : 'none'; // Toggle Copy Button
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

    // Copy All Text Functionality
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(textArea.value).then(() => {
            // Optional: Provide feedback to the user
            alert('Text copied to clipboard!');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    });
	
	   chrome.storage.sync.get('useLargeFont', (data) => {
        if (data.useLargeFont) {
            textArea.style.fontSize = '18px'; // Or your preferred large font size
        } else {
            textArea.style.fontSize = '14px'; // Your default font size
        }
    });

    // Do not modify the following function.
    chrome.storage.sync.get('textAreaBgColor', function(data) {
        if (data.textAreaBgColor) {
            textArea.style.backgroundColor = data.textAreaBgColor;
        }
    });
	const wordCount = document.getElementById('wordCount');
function updateWordCount() {
    const text = textArea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = `Words: ${words}`;
}
textArea.addEventListener('input', () => {
    localStorage.setItem("textAreaContent", textArea.value);
    updateWordCount();
});
// Initialize word count on load
updateWordCount();
	
});