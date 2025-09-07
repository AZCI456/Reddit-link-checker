// Functions are now loaded via manifest.json
// runOpenAIModeration, runPerspective, and calculateMean should be available globally


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
            background: #bbbbbbff;
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
                    <div style="background: rgba(0,0,0,0.2); padding: 5px; border-radius: 5px; text-align: center; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.25)); width: 72px; height: 75px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <img src="${chrome.runtime.getURL('png_files/warning.png')}" style="width: 50px; height: 50px; margin-bottom: 5px;">
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

//Creating a function to check whether or not the selection is a url
function isValidURL(text) {
    try {
        new URL(text);
        return true;
    } catch (_) {
        return false;
    }
}



// add event listenter to wait for text to be highlighted
document.addEventListener('mouseup', function(e) {
    // If the event target is inside the popup, do nothing

    if (e.target.closest('#safety_popup')) {
        return;
    }
    let selectedText = window.getSelection().toString().trim();

    // check if the users selection is valid
    if (selectedText.length > 0 && isValidURL(selectedText)) {
        // show popup.  A tiny delay ensures the selection sticks
        setTimeout(() => showPopup(selectedText, e.pageX, e.pageY), 10);
        chrome.runtime.sendMessage({ action: "setURL", url: selectedText });
        console.log(selectedText);
    } else {
        //show popup here
        return;
    }
});


// Later, you can retrieve it
//chrome.runtime.sendMessage({ action: "getURL" }, (response) => {
    //console.log("Global URL:", response.url);
//});

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


/////////////// Language check /////////////////

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



//////////////////// API TEXT ANALYSIS //////////////////////////////




// Analyze all paragraphs, unpack results, update flags and probability arrays
async function analyseAllParagraphs() {
    // Wait for modules to load
    if (!runOpenAIModeration || !runPerspective || !calculateMean) {
        console.error('Modules not loaded yet');
        return null;
    }

    const moderationCategories = {
        discrimination: false,
        nsfw: false,
        violence: false,
        hateSpeech: false,
        aiSlop: false
    };

    const THRESHOLD = 0.2;
    const safety_score_array = [];

    for (let item of data) {
        try {
            const OAIresult = await runOpenAIModeration(item.text);
            const PERPresult = await runPerspective(item.text);
            // For each moderation category, update flag and store probability
            for (const key of Object.keys(moderationCategories)) {
                if (OAIresult[key] >= THRESHOLD || PERPresult[key] >= THRESHOLD) {
                    moderationCategories[key] = true;
                }
            }
            // add the final safety scores (to be averaged per paragraph)
            safety_score_array.push(OAIresult.safetyScore || 0);
            safety_score_array.push(PERPresult.safetyScore || 0);
        } catch (error) {
            console.error('Moderation API call failed for paragraph', item.id, error);
        }
    }
<<<<<<< HEAD
    const meanSafetyScore = calculateMean(safety_score_array);
=======

    const meanSafetyScore = window.calculateMean(safety_score_array);
    console.log('Final results:', { meanSafetyScore, moderationCategories });
    
>>>>>>> 2efa1f2 (Offically working yay)
    return [meanSafetyScore, moderationCategories];
}



//////////////////// FRONT END FUNCITONALITY //////////////////////////////


// TEXT SELECTION FUNCTIONALITY
function showPopup(text, x, y) {
    console.log('showPopup called with:', { text: text.substring(0, 50), x, y });
    console.log('document.body exists:', !!document.body);
    console.log('document.readyState:', document.readyState);
    
    // remove existing popup first
    const existingPopup = document.getElementById('safety_popup');
    if (existingPopup){
        existingPopup.remove();
    }
    
    let popup = document.createElement('div');
    popup.id = 'safety_popup';
    popup.innerHTML = `
        <div style="
            background: #bbbbbbff;
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
                    <div style="background: rgba(0,0,0,0.2); padding: 5px; border-radius: 5px; text-align: center; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.25)); width: 72px; height: 75px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <img src="${chrome.runtime.getURL('png_files/warning.png')}" style="width: 50px; height: 50px; margin-bottom: 5px;">
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
    
    // Try multiple ways to append the popup
    try {
        if (document.body) {
            document.body.appendChild(popup);
            console.log('Popup appended to document.body successfully');
        } else if (document.documentElement) {
            document.documentElement.appendChild(popup);
            console.log('Popup appended to document.documentElement successfully');
        } else {
            console.error('No valid container found for popup');
            return;
        }
    } catch (error) {
        console.error('Error appending popup:', error);
        return;
    }

    
    // Run analysis directly
    console.log('Running analysis for text:', text);
    analyseAllParagraphs(text).then((result) => {
        if (result) {
            const [meanSafetyScore, moderationCategories] = result;
            console.log('Analysis complete! Mean score:', meanSafetyScore);
            console.log('Moderation categories:', moderationCategories);
            
            // Update the popup UI with results
            updatePopupWithResults(meanSafetyScore, moderationCategories);
        } else {
            console.log('Analysis returned null (modules not loaded)');
        }
    }).catch((error) => {
        console.error('Analysis failed:', error);
    });
}

// Function to update popup UI based on analysis results
function updatePopupWithResults(meanSafetyScore, moderationCategories) {
    const popup = document.getElementById('safety_popup');
    if (!popup) return;

    console.log('Updating popup with results:', { meanSafetyScore, moderationCategories });

    // Calculate phase (1-5) based on safety score
    let phase;
    if (meanSafetyScore <= 0.2) phase = 1;
    else if (meanSafetyScore <= 0.4) phase = 2;
    else if (meanSafetyScore <= 0.6) phase = 3;
    else if (meanSafetyScore <= 0.8) phase = 4;
    else phase = 5;

    // Determine colors and image based on phase
    let backgroundColor, imageFile;
    if (phase <= 2) {
        // Phase 1-2: Green (safe)
        backgroundColor = '#12D188';
        imageFile = 'phase_1.png';
    } else if (phase === 3) {
        // Phase 3: Yellow (warning)
        backgroundColor = '#D1BE12';
        imageFile = 'phase_2.png';
    } else {
        // Phase 4-5: Red (danger)
        backgroundColor = '#BE4C4C';
        imageFile = 'phase_3.png';
    }

    // Update the main popup background
    const mainContainer = popup.querySelector('div');
    if (mainContainer) {
        mainContainer.style.background = backgroundColor;
    }

    // Update the Mr. Incredible image
    const mrIncredibleImg = popup.querySelector('img[src*="mr_incredible_lol"]');
    if (mrIncredibleImg) {
        mrIncredibleImg.src = chrome.runtime.getURL(`png_files/mr_incredible_lol/${imageFile}`);
    }
    
    // Update Safety Score percentage
    const safetyScoreDiv = popup.querySelector('div[style*="Safety Score"]');
    if (safetyScoreDiv) {
        const percentage = Math.round(meanSafetyScore * 100);
        safetyScoreDiv.innerHTML = `<div style="font-size: 8px; font-weight: bold;">Safety Score: ${percentage}%</div>`;
    }
    
    // Replace loading GIFs with actual results
    const analysisDivs = popup.querySelectorAll('div[style*="background: rgba(0,0,0,0.4)"]');
    const categories = ['discrimination', 'nsfw', 'violence', 'hateSpeech'];

    analysisDivs.forEach((div, index) => {
        if (index < categories.length) {
            const category = categories[index];
            const isFlagged = moderationCategories[category];
            
            // Find and replace only the loading GIF, keep the category text
            const loadingGif = div.querySelector('img[src*="loading.gif"]');
            if (loadingGif) {
                loadingGif.outerHTML = `<span style="color: white; font-size: 8px; margin-left: 2px;">${isFlagged ? '✅' : '❌'}</span>`;
            }
        }
    });
    
    console.log('Popup updated! Phase:', phase, 'Background:', backgroundColor, 'Image:', imageFile, 'Safety Score:', Math.round(meanSafetyScore * 100) + '%');
}


//Creating a function to check whether or not the selection is a url
function isValidURL(text) {
    try {
        new URL(text);
        return true;
    } catch (_) {
        return false;
    }
}




// add event listenter to wait for text to be highlighted
document.addEventListener('mouseup', function(e) {
    // If the event target is inside the popup, do nothing
    if (e.target.closest('#safety_popup')) {
        return;
    }
    let selectedText = window.getSelection().toString();
    if (selectedText.length > 0) {
        console.log('Text selected, showing popup...');
        // show popup.  A delay ensures the selection sticks and DOM is ready
        setTimeout(() => {
            if (document.body && document.readyState === 'complete') {
                console.log('DOM ready, calling showPopup');
                showPopup(selectedText, e.pageX, e.pageY);
            } else {
                console.log('DOM not ready, waiting...');
                setTimeout(() => showPopup(selectedText, e.pageX, e.pageY), 100);
            }
        }, 50);
    } else {
        console.log('No text selected');
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