// assets/scripts/sitenotes.js
document.addEventListener('DOMContentLoaded', () => {
    const notesContainer = document.getElementById('notes-container');

    function displayNotes() {
        chrome.storage.local.get(null, (items) => {
            notesContainer.innerHTML = ''; // Clear existing notes
            for (const [key, value] of Object.entries(items)) {
                // A simple heuristic to identify site notes: check if the key is a URL.
                if (key.startsWith('http://') || key.startsWith('https://')) {
                    const noteCard = createNoteCard(key, value);
                    notesContainer.appendChild(noteCard);
                }
            }
        });
    }

    function createNoteCard(url, content) {
        const card = document.createElement('div');
        card.className = 'note-card';

        const header = document.createElement('div');
        header.className = 'note-card-header';
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.textContent = url;
        header.appendChild(link);

        const noteContent = document.createElement('div');
        noteContent.className = 'note-card-content';
        noteContent.textContent = content;

        const actions = document.createElement('div');
        actions.className = 'note-card-actions';
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => {
            chrome.storage.local.remove(url, () => {
                card.remove();
            });
        };
        actions.appendChild(deleteButton);

        card.appendChild(header);
        card.appendChild(noteContent);
        card.appendChild(actions);

        return card;
    }

    displayNotes();
});
