import { isValidUrl } from './language.js'; // 
import { showTooltip, hideTooltip } from './tooltip.js';
import { checkUrlSafety } from './api.js';

let selectedText = "";
let selectedRange = null;

// Track text selection
document.addEventListener("mouseup", () => {
  const sel = window.getSelection();
  if (sel && sel.toString().trim() !== "") {
    const text = sel.toString().trim();
    
    // Only store if it's a URL
    if (isValidUrl(text)) {
      selectedText = text;
      selectedRange = sel.getRangeAt(0);
    } else {
      selectedText = "";
      selectedRange = null;
      hideTooltip();
    }
  } else {
    selectedText = "";
    selectedRange = null;
    hideTooltip();
  }
});

// Handle ArrowUp key
document.addEventListener("keydown", async (e) => {
  if (e.key === "ArrowUp" && selectedText && selectedRange) {
    e.preventDefault(); // Prevent page scroll
    
    // Run your extension process
    const results = await processUrl(selectedText);
    
    // Show tooltip with results
    showTooltip(selectedRange, results);
  }
});

async function processUrl(url) {
  try {
    // Your extension logic here
    const safetyCheck = await checkUrlSafety(url);
    return {
      url: url, // return the title of the webpage
      safety: safetyCheck, 
      timestamp: new Date().toLocaleString()
    };
  } catch (error) {
    return {
      url: url,
      error: "Could not analyze URL",
      timestamp: new Date().toLocaleString()
    };
  }
}