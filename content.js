/* EXTRACT ALL THE TEXT FROM WEB IN THE BACKGROUND */
console.log('💥 CONTENT SCRIPT LOADED!');

const paragraphs = Array.from(document.querySelectorAll('p'))
.map(p => p.innerText.trim())
.filter(text => text.length > 5);


const data = paragraphs.map((text, idx) => ({
    id: idx,
    text,
    results: {}  // stores API responses here 
}))

// Extract image alt text for NSFW image API
const imageAlts = Array.from(document.querySelectorAll('img'))
    .map(img => img.alt)
    .filter(alt => alt && alt.trim().length > 0) // Only non-empty alt text


/* CHECK IF PAGE CONTENT IS IN ENGLISH. IF NOT EXIT IN async */
function isEnglishPage(){
    const htmlLang = document.documentElement.lang;
    console.log(`Page language: ${htmlLang}`);

    // Check if html delcared language starts with 'en' (en, en-US, etc.)
    return htmlLang && htmlLang.toLowerCase().startsWith('en');
}

// Check if page is in English - EXIT if not
if (!isEnglishPage()) {
    console.log('Sorry mate page is not in English, exiting...');
    // Send message to popup that page is not English
    chrome.runtime.sendMessage({
        type: 'NOT_ENGLISH',
        message: 'Page is not in English'
    });
    // EXIT ALL PROCESS
    throw new Error('Page is not in English - stopping all processing');
}

// Only run this if page IS in English
console.log('Page is in English, text extraction complete!');
console.log('FOUND PARAGRAPHS:', {
    totalParagraphs: paragraphs.length,
    totalDataItems: data.length,
    totalImageAlts: imageAlts.length,
    sampleTexts: data.slice(0, 3).map(item => ({
        id: item.id,
        text: item.text.substring(0, 100) + '...'
    })),
    sampleImageAlts: imageAlts.slice(0, 5) // Show first 5 alt texts
});

// Extract all LINKS on the page
const linkUrls = Array.from(document.querySelectorAll('a'))
    .map(link => link.href)
    .filter(url => url && url.trim().length > 0);  // non-empty URLs

// get current page URL
const currentPageUrl = window.location.href;

// COMBINE ALL URLs IN CURRENT PAGE TO CHECK
const allUrls = [currentPageUrl, ...linkUrls];

console.log('URLs to check for safety:', {
    currentPage: currentPageUrl,
    totalLinks: linkUrls.length,
    allUrls: allUrls.slice(0,-1) 
})

// SEND ALL URLS TO 'background.js' for safe check
chrome.runtime.sendMessage({
    type: 'GOOGLE_SAFE_LINK',
    urls: allUrls
}, (response) => {
    if (response && response.success){
        console.log('URL safety check completed:', response.results);
    } else {
        console.error('URL safety check failed:', response);
    }
})


// TEXT SELECTION FUNCTIONALITY
function showPopup(text, x, y) {
    // remove existing popup first
    const existingPopup = document.getElementById('prev_popup');
    if (existingPopup){
        existingPopup.remove();
    }
    let popup = document.createElement('div');  // create div element 
    popup.id = 'prev_popup';
    popup.innerHTML = `Selected: ${text}`;
    popup.style.position = 'fixed';
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
    popup.style.background = 'white'; 
    popup.style.border = '2px solid black';
    popup.style.padding = '10px';
    popup.style.zIndex = '9999'; // Make sure it's on top
    
    document.body.appendChild(popup);
}



// add event listenter to wait for text to be highlighted
document.addEventListener('mouseup', function(e) {  // 'mouseup' added as a safe-lock mechanism
    let selectedText = window.getSelection().toString();
    if (selectedText.length > 0){
        // show popup
        showPopup(selectedText, e.pageX, e.pageY);
         
    }
});

// Set a small delay to prevent the popup from being removed too soon
document.addEventListener('mousedown', function (e) {
    // Only remove if no text is currently selected
    let selectedText = window.getSelection().toString();
    if (selectedText.length === 0) {
    // Check if click is NOT on the popup itself
    if (!e.target.closest('#prev_popup')) {
        const popup = document.getElementById('prev_popup');
        
            popup.remove();
        
    }
};
});

let selsectionCoords = {x: 0, y: 0};
