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
  
  // Send response back
  sendResponse({ success: true });
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('SafeLink Installed!');
});
