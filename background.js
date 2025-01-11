function shouldShowNotification() {
  return new Promise((resolve) => {
      chrome.storage.sync.get(['notifywhencontextadd'], (items) => {
          resolve(items.notifywhencontextadd !== false);
      });
  });
}
chrome.commands.onCommand.addListener((command) => {
    if (command === 'open_popup') {
      chrome.action.openPopup();
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.enableTabs) {
        // The enableTabs setting has changed, update the context menu
        updateContextMenu();
    }
});
  
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set initial settings before creating context menu
        chrome.storage.sync.set({
            'enableTabs': true,  // Set default to true
            'note1Name': 'Note 1',
            'note2Name': 'Note 2',
            'note3Name': 'Note 3'
        }, () => {
            updateContextMenu();  // Update context menu after settings are saved
        });
        // Open options page
        chrome.tabs.create({ url: 'options.html' });
    } else {
        updateContextMenu();  // Update for other installation cases
    }
  });
  

  function updateContextMenu() {
    chrome.contextMenus.removeAll(() => {
        chrome.storage.sync.get(['enableTabs', 'note1Name', 'note2Name', 'note3Name'], (items) => {
            const enableTabs = items.enableTabs;
            const noteNames = [
                items.note1Name || 'Note 1',
                items.note2Name || 'Note 2',
                items.note3Name || 'Note 3'
            ];

            chrome.contextMenus.create({
                id: 'sticky-notes',
                title: 'Sticky Notes',
                contexts: ['selection']
            });

            if (enableTabs) {
                // Create menu items for multiple notes
                for (let i = 0; i < noteNames.length; i++) {
                    chrome.contextMenus.create({
                        id: `add-to-note-${i + 1}`,
                        title: `Add to ${noteNames[i]}`,
                        contexts: ['selection'],
                        parentId: 'sticky-notes'
                    });
                }
            } else {
                // Create single menu item for single note mode
                chrome.contextMenus.create({
                    id: 'add-to-single-note',
                    title: 'Add to Note',
                    contexts: ['selection'],
                    parentId: 'sticky-notes'
                });
            }
        });
    });
}

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const selectedText = info.selectionText;

    chrome.storage.sync.get(['enableTabs', 'notifywhencontextadd'], (items) => {
        const enableTabs = items.enableTabs;
        const noteId = enableTabs ? info.menuItemId.replace('add-to-note-', '') : 'singleNote';
        const noteKey = enableTabs ? `textAreaContent_note${noteId}` : 'textAreaContent';

        chrome.storage.sync.get([noteKey], (result) => {
            const existingContent = result[noteKey] || '';
            const newContent = existingContent ? `${existingContent}\n\n${selectedText}` : selectedText;

            chrome.storage.sync.set({ [noteKey]: newContent }, () => {
                // Send message to popup if it's open
                chrome.runtime.sendMessage({
                    action: 'addTextToNote',
                    noteId: noteId,
                    selectedText: selectedText
                }).catch(() => {
                    console.log('Popup is closed, content will be updated when opened');
                });

                // Only show notification if enabled in settings
                if (items.notifywhencontextadd !== false) {
                    try {
                        const noteName = enableTabs ? `Note ${noteId}` : 'Note';
                        chrome.notifications.create('', {
                            type: 'basic',
                            iconUrl: '/icon48.png',
                            title: 'Text Added Successfully',
                            message: `Text has been added to ${noteName}`,
                            priority: 2
                        }, (notificationId) => {
                            if (chrome.runtime.lastError) {
                                console.error('Notification error:', chrome.runtime.lastError);
                            }
                        });
                    } catch (error) {
                        console.error('Error creating notification:', error);
                    }
                }
            });
        });
    });
});

chrome.notifications.onClosed.addListener((notificationId) => {
  // Clear notification after it's closed
  chrome.notifications.clear(notificationId);
});

// Auto-clear notifications after 3 seconds
const NOTIFICATION_TIMEOUT = 3000;

function createNotificationWithTimeout(options) {
  chrome.notifications.create(options, (notificationId) => {
      setTimeout(() => {
          chrome.notifications.clear(notificationId);
      }, NOTIFICATION_TIMEOUT);
  });
}