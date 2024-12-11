chrome.commands.onCommand.addListener((command) => {
  if (command === 'open_popup') {
      chrome.action.openPopup();
  }
});
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // This is the first install
    chrome.tabs.create({ url: 'options.html' });
  }
});
