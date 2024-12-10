document.addEventListener('DOMContentLoaded', () => {
    const settingsIcon = document.getElementById('settingsIcon');
    const textArea = document.getElementById('textArea');
    const exportButton = document.getElementById('exportButton');

    const wordCount = document.getElementById('wordCount');
    const tabContainer = document.querySelector('.tab-container');
    const tabButtons = document.querySelectorAll('.tab-button');

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
        'useLargeFont': false, // Add useLargeFont preference
    }, (items) => {
        textArea.style.backgroundColor = items.textAreaBgColor;
        exportButton.style.display = items.showExportButton ? 'block' : 'none';
    
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
    
        enableTabs = items.enableTabs;
    
        if (enableTabs) {
            // Show tabs and enable multi-note functionality
            tabContainer.style.display = 'flex';
            setupTabs();
        } else {
            // Hide tabs and use single note
            tabContainer.style.display = 'none';
            currentNote = 'singleNote'; // Use a distinct identifier
            loadSingleNoteContent();
            // Remove event listeners from tabs to prevent unexpected behavior
            tabButtons.forEach(button => {
                button.removeEventListener('click', handleTabClick);
            });
        }
    });

    // Function to handle tab clicks
    function handleTabClick(event) {
        const button = event.currentTarget;
        // Save current note content
        saveCurrentNoteContent();

        // Update active tab
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update current note
        currentNote = button.getAttribute('data-note');

        // Load note content
        loadCurrentNoteContent();
    }

    // Function to setup tabs
    function setupTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', handleTabClick);
        });
        // Initialize by loading content for the default note
        loadCurrentNoteContent();
    }

    // Load content for the current note when tabs are enabled
    function loadCurrentNoteContent() {
        const key = `textAreaContent_${currentNote}`;
        chrome.storage.sync.get([key], (result) => {
            const savedContent = result[key] || "";
            textArea.value = savedContent;
            updateWordCount();
        });
    }

    // Save content for the current note when tabs are enabled
    function saveCurrentNoteContent() {
        const key = `textAreaContent_${currentNote}`;
        const content = textArea.value;
        chrome.storage.sync.set({ [key]: content }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving note content:', chrome.runtime.lastError);
            }
        });
    }

    // Load content for the single note when tabs are disabled
    function loadSingleNoteContent() {
        const key = 'textAreaContent';
        chrome.storage.sync.get([key], (result) => {
            const savedContent = result[key] || "";
            textArea.value = savedContent;
            updateWordCount();
        });
    }

    // Save content for the single note when tabs are disabled
    function saveSingleNoteContent() {
        const key = 'textAreaContent';
        const content = textArea.value;
        chrome.storage.sync.set({ [key]: content }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving single note content:', chrome.runtime.lastError);
            }
        });
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
        if (wordCount.style.display === 'none') return; // Do not update if hidden
        const text = textArea.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        wordCount.textContent = `Words: ${words}`;
    }

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