/* BACKGROUND SCRIPT - HANDLES MESSAGES FROM CONTENT SCRIPT */

console.log('💥BACKGROUND SCRIRPT LOADED');
const SAFE_BROWSING_API_KEY = 'undefined';  // automatically read by inject-env.js script from your api key declared in .env
const SAFE_BROWSING_API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';



// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.type === 'NOT_ENGLISH') {
    console.log('Page is not in English, skipping...');
  }
  if (message.action === "setURL") {
    // Store the URL globally
    chrome.storage.local.set({ url: message.url }, () => {});
  }

  // Handle HTML extraction from a newly opened tab
  if (message.type === 'EXTRACTED_HTML') {
    // Received HTML from content script after extraction
    console.log('Extracted HTML from tab:', sender.tab ? sender.tab.url : 'unknown');
    // For debugging: print a snippet of the HTML
    console.log('HTML snippet:', message.html.substring(0, 500));
    // Close the tab after extraction
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id, () => {
        console.log('Tab closed after extraction.');
      });
    }
    sendResponse({ success: true, info: "HTML received and tab closed" });
    return true;
  }

  // Send response back
  sendResponse({ success: true });
});

/**
 * Opens a URL in a new tab, injects a whiteout style, extracts the HTML, and closes the tab.
 * @param {string} url - The URL to open and extract HTML from.
 */
function extractHtmlFromUrl(url) {
  // Open the URL in a new, inactive tab
  chrome.tabs.create({ url: url, active: false }, (tab) => {
    if (!tab || !tab.id) {
      console.error('Failed to open tab for URL:', url);
      return;
    }
    const tabId = tab.id;
    // Wait for the tab to finish loading
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        // Remove this listener so it doesn't fire again
        chrome.tabs.onUpdated.removeListener(listener);

        // 1. Inject CSS to white out the page (hide content from user)
        chrome.scripting.insertCSS({
          target: { tabId: tabId },
          css: 'body,html{background:#fff!important;} *{color:#fff!important;}'
        }, () => {
          // 2. Inject a script to extract HTML and send it to background
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
              // This code runs in the page context
              const html = document.documentElement.outerHTML;
              // Send the HTML back to the background script
              chrome.runtime.sendMessage({ type: 'EXTRACTED_HTML', html });
            }
          });
        });
      }
    });
  });
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('SafeLink Installed!');

});