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
    sampleTexts: data.slice(0, 3).map(item => ({
        id: item.id,
        text: item.text.substring(0, 100) + '...'
    }))
});

// COMMENTED OUT API CALLS FOR NOW
/*
async function analyzeText(text){
    try {
        // Early exit if not English
        if (!isEnglishPage()) {
            console.log('Not English, skipping API calls');
            return { toxicity: 0, sentiment: 0, hate: 0, inappropriate: 0, language: 'non-english' };
        }

        // Call multiple APIs in parallel
        const [toxicity, sentiment, hate, inappropriate] = await Promise.all([
            runGoogleSafeLink(text),
            runPerspective(text),
            runOpenAIMod(text)
        ]);
        
        return { toxicity, sentiment, hate, inappropriate };
    } catch (error) {
        console.error('Whoops... analysis failed, sorry :( exiting...', error);
        return { toxicity: 0, sentiment: 0, hate: 0, inappropriate: 0 };
    }
}

// Placeholder API functions (replace with real APIs later)
async function runGoogleSafeLink(text) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return Math.random() * 100;
}

async function runPerspective(text) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return Math.random() * 100;
}

async function runOpenAIMod(text) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return Math.random() * 100;
}

// Actually run the analysis on all extracted text
async function processAllTexts() {
    console.log('Starting to process all extracted texts...');
    
    for (let item of data) {
        console.log(`Analyzing text ${item.id}: ${item.text.substring(0, 50)}...`);
        item.results = await analyzeText(item.text);
        console.log(`Results for text ${item.id}:`, item.results);
    }
    
    console.log('All texts processed!', data);
}

// Run the analysis when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processAllTexts);
} else {
    processAllTexts();
}
*/