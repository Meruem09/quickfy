chrome.runtime.onInstalled.addListener(() => {
  console.log("Text Verifier installed!")
})
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});
