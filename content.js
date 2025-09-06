import { runOpenAIModeration, runPerspective } from "./index.js";
import { calculateMean } from "./util.js";

//import { runOpenAIModeration } from "./runOpenAIModeration.js";

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





// Object to hold global flags and probability arrays for each moderation category
const moderationCategories = {
    discrimination: false,
    nsfw: false,
    violence: false,
    hateSpeech: false,
    aiSlop: false
};

// Analyze all paragraphs, unpack results, update flags and probability arrays
async function analyseAllParagraphs() {

    const moderationCategories = {
        discrimination: false,
        nsfw: false,
        violence: false,
        hateSpeech: false,
        aiSlop: false
        };

    THRESHOLD = 0.2;

    const safety_score_array = []

    for (let item of data) {
        try {
            const OAIresult = await runOpenAIModeration(item.text);
            const PERPresult = await runPerspective(item.text)
            //item.results = OAIresult;
            // For each moderation category, update flag and store probability
            for (const key of Object.keys(moderationCategories)) {
                if (OAIresult[key] >= THRESHOLD || PERPresult[key] >= THRESHOLD) {
                    moderationCategories[key] = true;
                }
            }
            // add the final safety scores (to be averaged per paragraph)
            safety_score_array.push(OAIresult[safetyScore])
            safety_score_array.push(PERPresult[safetyScore])
        } catch (error) {
            console.error('Moderation API call failed for paragraph', item.id, error);
            item.results = null;
        }
    }
    return calculateMean(safety_score_array), moderationCategories;
}

// Call this function after extracting paragraphs
//const finalSafetyScore = analyseAllParagraphs();



