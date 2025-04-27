// background.js
let contextMenuInitialized = false;
let isInitialSetup = false; // Add this line


console.log("Background script loaded.");

// Helper function to create the context menu.
function createContextMenu(items) {
  console.log("createContextMenu called with items:", items);
  const enableTabs = items.enableTabs;
  const tableMode = items.tableMode; // Get tableMode setting
  const noteNames = [
      items.note1Name || 'Note 1',
      items.note2Name || 'Note 2',
      items.note3Name || 'Note 3'
  ];

  // --- Only create menu if tableMode is false ---
  if (!tableMode) {
      // Create parent menu
      chrome.contextMenus.create({
          id: 'sticky-notes',
          title: 'Sticky Notes',
          contexts: ['selection']
      }, () => {
          if (chrome.runtime.lastError) {
              console.log('Parent menu creation error (might exist):', chrome.runtime.lastError.message);
              // If parent exists, updateContextMenu already removed children. Proceed to add new ones.
          }

          // Create children based on enableTabs
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
                          console.log(`Menu "${menuId}" creation error (might exist):`, chrome.runtime.lastError.message);
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
                      console.log('Single note menu creation error (might exist):', chrome.runtime.lastError.message);
                  }
              });
          }
          console.log("Context menu items created (or attempted).");
          // Add the listener *only if* we successfully created the menu structure
          addContextMenuClickListener(); // This function checks contextMenuInitialized internally
      });
  } else {
      console.log("Table mode is enabled. Skipping context menu creation.");
      // Listener is not added because addContextMenuClickListener won't be called.
      // The listener was already removed in updateContextMenu.
  }
}

// Function to update (remove and recreate) the context menu.
function updateContextMenu() {
    console.log("updateContextMenu called.");
    chrome.contextMenus.removeAll(() => {
        if (chrome.runtime.lastError) {
            console.error("Error removing context menus:", chrome.runtime.lastError);
            // Proceed anyway, maybe the menu didn't exist
        }
        // --- Remove listener and reset flag *before* creating menu ---
        chrome.contextMenus.onClicked.removeListener(contextMenuClickHandler);
        contextMenuInitialized = false;
        console.log("Context menu listener removed (if existed).");

        // --- Fetch tableMode along with other settings ---
        chrome.storage.sync.get(['enableTabs', 'tableMode', 'note1Name', 'note2Name', 'note3Name'], (items) => {
            if (chrome.runtime.lastError) {
                console.error("Error getting settings for context menu:", chrome.runtime.lastError);
                return;
            }
            // Create the menu (conditionally based on items.tableMode)
            createContextMenu(items);
            // Listener is added inside createContextMenu if needed
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
  // --- Trigger update if enableTabs OR tableMode changes OR a note name is removed ---
  let shouldUpdateMenu = false;
  if (namespace === 'sync' && !isInitialSetup) {
      if (changes.enableTabs || changes.tableMode) {
          shouldUpdateMenu = true;
          console.log("Relevant setting changed (enableTabs or tableMode). Updating context menu.");
      } else if (changes.note1Name || changes.note2Name || changes.note3Name) {
          // Check if a note name was removed (new value is missing or empty)
          for (const key in changes) {
              if (key.endsWith('Name') && !changes[key].newValue) {
                  shouldUpdateMenu = true;
                  console.log(`Note name removed (${key}). Updating context menu.`);
                  break;
              }
          }
          // Also update if a name changed while tabs are enabled
          if (!shouldUpdateMenu && (changes.note1Name?.newValue || changes.note2Name?.newValue || changes.note3Name?.newValue)) {
               chrome.storage.sync.get('enableTabs', (items) => {
                   if(items.enableTabs) {
                       console.log("Note name changed while tabs enabled. Updating context menu.");
                       updateContextMenu();
                   }
               });
          }
      }
  }

  if (shouldUpdateMenu) {
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
          'showStylingButtons': true,
          'backgroundColor': '#FAFAD2', // Updated default background color
          'textAreaBgColor': '#E0FFFF', // Updated default note color & corrected key
          'tableMode': false, 
          'tableModeUnlocked': false 
      }, () => {
          // 2. *After* settings are set, create the context menu.
          updateContextMenu(); // This will now read the initial tableMode setting
          // 3. *After* the context menu is created, open the options page.
          chrome.tabs.create({ url: 'options.html' });
          isInitialSetup = false; // Reset flag after setup
      });
  } else if (details.reason === 'update') {
      // On update, ensure default values exist if they were added in this version
      chrome.storage.sync.get(['tableMode', 'tableModeUnlocked'], (items) => {
          const defaultsToSet = {};
          if (items.tableMode === undefined) {
              defaultsToSet.tableMode = false;
          }
          if (items.tableModeUnlocked === undefined) {
              defaultsToSet.tableModeUnlocked = false;
          }
          if (Object.keys(defaultsToSet).length > 0) {
              chrome.storage.sync.set(defaultsToSet, () => {
                  // After setting defaults (if any), update the context menu
                  updateContextMenu();
              });
          } else {
              // If defaults already exist, just update the context menu
              updateContextMenu();
          }
      });
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