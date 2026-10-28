// The toolbar button opens Blank Page in a new tab. (New tabs open it too,
// through `chrome_url_overrides` in the manifest.) Firefox also provides the
// `chrome` namespace.
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
