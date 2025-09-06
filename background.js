/* BACKGROUND SCRIPT - HANDLES MESSAGES FROM CONTENT SCRIPT */

console.log('Reddit Cursed Content Detector - Background Script Loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.type === 'NOT_ENGLISH') {
    console.log('Page is not in English, skipping analysis');
  }
  
  // Send response back
  sendResponse({ success: true });
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Reddit Cursed Content Detector installed');
});
