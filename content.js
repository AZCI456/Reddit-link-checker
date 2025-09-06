/* EXTRACT ALL THE TEXT FROM WEB IN THE BACKGROUND */
const paragraphs = Array.from(document.querySelectorAll('p'))
.map(p => p.innerText.trim())
.filter(text => text.length > 10);

console.log(paragraphs);

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

// Early exit if not English
if (!isEnglishPage()) {
    console.log('Sorry mate page is not in English, exiting...');
    // Send message to popup that page is not English
    chrome.runtime.sendMessage({
        type: 'NOT_ENGLISH',
        message: 'Page is not in English'
    });
    return;
} 

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