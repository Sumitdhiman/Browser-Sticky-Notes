// background.js
let contextMenuInitialized = false;
let isInitialSetup = false; // Add this line


console.log("Background script loaded.");

// Helper function to create the context menu.
function createContextMenu(items) {
  console.log("createContextMenu called with items:", items);
  const enableTabs = items.enableTabs;
  const noteNames = [
      items.note1Name || 'Note 1',
      items.note2Name || 'Note 2',
      items.note3Name || 'Note 3'
  ];

  // Create parent menu
  chrome.contextMenus.create({
      id: 'sticky-notes',
      title: 'Sticky Notes',
      contexts: ['selection']
  }, () => {
      if (chrome.runtime.lastError) {
          console.log('Parent menu already exists:', chrome.runtime.lastError.message);
          return; // Skip creating children if parent exists
      }

      if (enableTabs) {
          for (let i = 0; i < noteNames.length; i++) {
              const menuId = `add-to-note-${i + 1}`;
              chrome.contextMenus.create({
                  id: menuId,
                  title: `Add to ${noteNames[i]}`,
                  contexts: ['selection'],
                  parentId: 'sticky-notes'
              }, () => {
                  if (chrome.runtime.lastError) {
                      console.log(`Menu "${menuId}" exists:`, chrome.runtime.lastError.message);
                  }
              });
          }
      } else {
          chrome.contextMenus.create({
              id: 'add-to-single-note',
              title: 'Add to Note',
              contexts: ['selection'],
              parentId: 'sticky-notes'
          }, () => {
              if (chrome.runtime.lastError) {
                  console.log('Single note menu exists:', chrome.runtime.lastError.message);
              }
          });
      }
      console.log("Context menu updated.");
  });
}

// Function to update (remove and recreate) the context menu.
function updateContextMenu() {
    console.log("updateContextMenu called.");
    chrome.contextMenus.removeAll(() => {
        if (chrome.runtime.lastError) {
            console.error("Error removing context menus:", chrome.runtime.lastError);
        }
        chrome.storage.sync.get(['enableTabs', 'note1Name', 'note2Name', 'note3Name'], (items) => {
            createContextMenu(items);
            addContextMenuClickListener(); // Add listener after creation
        });
    });
}

// Click handler (defined separately for clarity).
function contextMenuClickHandler(info, tab) {
    console.log("Context menu clicked:", info);
    const selectedText = info.selectionText;

    chrome.storage.sync.get(['enableTabs', 'notifywhencontextadd'], (items) => {
        const enableTabs = items.enableTabs;
        const noteId = enableTabs ? info.menuItemId.replace('add-to-note-', '') : 'singleNote';
        const noteKey = enableTabs ? `textAreaContent_note${noteId}` : 'textAreaContent';

        chrome.storage.sync.get([noteKey], (result) => {
            const existingContent = result[noteKey] || '';
            const newContent = existingContent ? `${existingContent}\n\n${selectedText}` : selectedText;

            chrome.storage.sync.set({ [noteKey]: newContent }, () => {
                chrome.runtime.sendMessage({
                    action: 'addTextToNote',
                    noteId: noteId,
                    selectedText: selectedText
                }).catch(() => {
                    console.log('Popup is closed, content will be updated when opened');
                });

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
}

// Function to add the context menu click listener.
function addContextMenuClickListener() {
    console.log("addContextMenuClickListener called. contextMenuInitialized:", contextMenuInitialized);
    if (!contextMenuInitialized) {
        chrome.contextMenus.onClicked.addListener(contextMenuClickHandler);
        contextMenuInitialized = true;
        console.log("Context menu click listener added.");
    }
}

// --- Event Listeners ---

chrome.commands.onCommand.addListener((command) => {
    if (command === 'open_popup') {
        chrome.action.openPopup();
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.enableTabs && !isInitialSetup) { // Add !isInitialSetup check
      console.log("enableTabs changed. Updating context menu.");
      chrome.contextMenus.onClicked.removeListener(contextMenuClickHandler);
      contextMenuInitialized = false;
      updateContextMenu();
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log("onInstalled triggered. Reason:", details.reason);
  if (details.reason === 'install') {
      isInitialSetup = true; // Set flag to true
      // 1. Set initial settings.
      chrome.storage.sync.set({
          'enableTabs': true,
          'note1Name': 'Note 1',
          'note2Name': 'Note 2',
          'note3Name': 'Note 3',
          'notifywhencontextadd': true,
          'showStylingButtons': true  // Add this line
      }, () => {
          // 2. *After* settings are set, create the context menu.
          updateContextMenu();
          // 3. *After* the context menu is created, open the options page.
          chrome.tabs.create({ url: 'options.html' });
          isInitialSetup = false; // Reset flag after setup
      });
  } else if (details.reason === 'update') {
      // On update, just update the context menu (re-add listener).
      updateContextMenu();
  }
});


// Use onStartup *only* as a fallback.
chrome.runtime.onStartup.addListener(() => {
    console.log("onStartup triggered. contextMenuInitialized:", contextMenuInitialized);
    // Check if the context menu was initialized by onInstalled.
    if (!contextMenuInitialized) {
        console.log("Context menu NOT initialized by onInstalled. Initializing now.");
        updateContextMenu(); // Fallback initialization
    }
});

chrome.notifications.onClosed.addListener((notificationId) => {
    chrome.notifications.clear(notificationId);
});

const NOTIFICATION_TIMEOUT = 3000;

function createNotificationWithTimeout(options) {
    chrome.notifications.create(options, (notificationId) => {
        setTimeout(() => {
            chrome.notifications.clear(notificationId);
        }, NOTIFICATION_TIMEOUT);
    });
}

let clickCounter = 0;
let lastClickTime = 0;
const CLICK_TIMEOUT = 5000; // 5 seconds timeout
const REQUIRED_CLICKS = 5;

// Add the message listener for handling bmc clicks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'handleBmcClick') {
        const currentTime = Date.now();
        if (currentTime - lastClickTime > CLICK_TIMEOUT) {
            // Reset counter if too much time has passed
            clickCounter = 1;
        } else {
            clickCounter++;
        }
        lastClickTime = currentTime;

        if (clickCounter === REQUIRED_CLICKS) {
            // Show the mode toggle when click count reached
            chrome.storage.sync.set({ 'tableModeUnlocked': true });
            clickCounter = 0; // Reset counter
            // Notify any open popups
            chrome.runtime.sendMessage({ action: 'unlockTableMode' });
        }
    }
});