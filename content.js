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
console.log(' Summary:', {
    totalParagraphs: paragraphs.length,
    totalDataItems: data.length,
    totalImageAlts: imageAlts.length,
    sampleTexts: data.slice(0, 3).map(item => ({
        id: item.id,
        text: item.text.substring(0, 100) + '...'
    })),
    sampleImageAlts: imageAlts.slice(0, 5) // Show first 5 alt texts
});

// COMMENTED OUT API CALLS FOR NOW
/*
async function analyzeText(text){
    try {
    const [api1, api2, api3] = await Promise.all([
      callApi1(text),
      callApi2(text),
      callApi3(text)
    ]);
    
    return { api1, api2, api3 };
  } catch (error) {
    console.error('API call failed:', error);
    return { api1: null, api2: null, api3: null };
  }
}

// Placeholder API functions (replace with real APIs later)
*/

