chrome.commands.onCommand.addListener((command) => {
  if (command === 'open_popup') {
      chrome.action.openPopup();

  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        })
          .then(() => console.log('injected script into: ' + tab.url))
          .catch(err => console.log(err));
    }
});