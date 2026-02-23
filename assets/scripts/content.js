// assets/scripts/content.js
(() => {
  let noteDiv = null;
  let textarea = null;
  let noteUrl = window.location.href;

  function createNoteUI(content) {
    if (document.getElementById('website-sticky-note')) return;

    noteDiv = document.createElement('div');
    noteDiv.id = 'website-sticky-note';

    const header = document.createElement('div');
    header.id = 'website-sticky-note-header';
    header.textContent = 'Sticky Note';

    const closeButton = document.createElement('button');
    closeButton.id = 'website-sticky-note-close';
    closeButton.textContent = 'X';
    closeButton.onclick = () => noteDiv.remove();

    header.appendChild(closeButton);

    textarea = document.createElement('textarea');
    textarea.id = 'website-sticky-note-textarea';
    textarea.value = content;
    textarea.placeholder = 'Type your note for this page...';

    textarea.addEventListener('input', () => {
      chrome.storage.local.set({ [noteUrl]: textarea.value });
    });

    noteDiv.appendChild(header);
    noteDiv.appendChild(textarea);
    document.body.appendChild(noteDiv);

    makeDraggable(noteDiv, header);
  }

  function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  chrome.storage.local.get([noteUrl], (result) => {
    if (result[noteUrl]) {
      createNoteUI(result[noteUrl]);
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'create_note_for_url') {
      if (!noteDiv) {
        createNoteUI('');
      }
      sendResponse({ status: 'note created' });
      return true; // Indicate async response
    }
  });
})();
