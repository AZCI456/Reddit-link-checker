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
    chrome.storage.local.set({ url: message.url }, () => {
    });
  }

  //retrieving sequence
/*  if (msg.action === "getURL") {
    // Retrieve the URL
    chrome.storage.local.get("url", (data) => {
      sendResponse({ url: data.url });
    });
    return true; // keep the channel open for async response
  }*/

  // Send response back
  sendResponse({ success: true });
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('SafeLink Installed!');

});
