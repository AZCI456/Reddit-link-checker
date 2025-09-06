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
    const existingPopup = document.getElementById('safety_popup');
    if (existingPopup){
        existingPopup.remove();
    }
    
    let popup = document.createElement('div');
    popup.id = 'safety_popup';
    popup.innerHTML = `
        <div style="
            background: #828282;
            border-radius: 5px;
            padding: 8px 8px 2px 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.25));
            color: white;
            font-family: 'Orbitron', monospace;
            font-weight: 700;
            width: 293px;
            min-width: 150px;
            max-width: 90vw;
        ">
        
            <div style="display: flex; justify-content: space-between; gap: 5px; align-items: flex-start">
                <img src="${chrome.runtime.getURL('png_files/mr_incredible_lol/phase_1.png')}" 
                     style="width: 72px; height: 95px; object-fit: cover; border-radius: 5px; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.25));top: 5px;">
                <div style="background: #12D188; padding: 5px; border-radius: 5px; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.25)); display: flex; gap: 5px; align-items: flex-start;">
                    <div style="background: rgba(0,0,0,0.2); padding: 5px; border-radius: 5px; text-align: center; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.25)); width: 72px; height: 75px; display: flex; align-items: center; justify-content: center;">
                        <div style="font-size: 8px; font-weight: bold;">Safety Score: 85%</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 7px;">
                        <div style="background: rgba(0,0,0,0.4); padding: 2px 4px; border-radius: 4px; text-align: center; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.25)); width: 105px; height: 12px; display: flex; align-items: flex-start; justify-content: center; padding-top: 3px;">Discrimination: <img src="${chrome.runtime.getURL('png_files/loading.gif')}" style="width: 8px; height: 8px; margin-left: 2px; margin-top: 2px;"></div>
                        <div style="background: rgba(0,0,0,0.4); padding: 2px 4px; border-radius: 4px; text-align: center; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.25)); width: 105px; height: 12px; display: flex; align-items: flex-start; justify-content: center; padding-top: 3px;">NSFW: <img src="${chrome.runtime.getURL('png_files/loading.gif')}" style="width: 8px; height: 8px; margin-left: 2px; margin-top: 2px;"></div>
                        <div style="background: rgba(0,0,0,0.4); padding: 2px 4px; border-radius: 4px; text-align: center; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.25)); width: 105px; height: 12px; display: flex; align-items: flex-start; justify-content: center; padding-top: 3px;">Hate Speech: <img src="${chrome.runtime.getURL('png_files/loading.gif')}" style="width: 8px; height: 8px; margin-left: 2px; margin-top: 2px;"></div>
                        <div style="background: rgba(0,0,0,0.4); padding: 2px 4px; border-radius: 4px; text-align: center; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.25)); width: 105px; height: 12px; display: flex; align-items: flex-start; justify-content: center; padding-top: 3px;">Violence: <img src="${chrome.runtime.getURL('png_files/loading.gif')}" style="width: 8px; height: 8px; margin-left: 2px; margin-top: 2px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    popup.style.position = 'fixed';
    popup.style.left = (x + 10) + 'px';
    popup.style.top = (y - 60) + 'px';
    popup.style.zIndex = '9999';
    
    document.body.appendChild(popup);
}



// add event listenter to wait for text to be highlighted
document.addEventListener('mouseup', function(e) {
    // If the event target is inside the popup, do nothing
    if (e.target.closest('#safety_popup')) {
        return;
    }
    let selectedText = window.getSelection().toString();
    if (selectedText.length > 0) {
        // show popup.  A tiny delay ensures the selection sticks
        setTimeout(() => showPopup(selectedText, e.pageX, e.pageY), 10);
    }
});

// Hide popup when clicking outside it, and clear selection
document.addEventListener('click', function(e) {
    const popup = document.getElementById('safety_popup');
    // If clicking inside the popup, do nothing
    if (e.target.closest('#safety_popup')) {
        return;
    }
    if (popup) {
        popup.remove();
        // Delay clearing selection so popup logic runs first
        // Delay clearing selection to avoid conflicts
        setTimeout(() => {
            window.getSelection().removeAllRanges();
        }, 100);; // clear selection after hiding so no double clicking needed
    }
});

let selsectionCoords = {x: 0, y: 0};
