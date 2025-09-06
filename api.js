// Unified API functions for the extension
import OpenAI from "openai";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// Initialize APIs
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;
const PERSPECTIVE_URL = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`;

// OpenAI Moderation Function (copied from openAI.js)
const threshold = 0.2;
    const flagged = false;
    const hateSpeechParameters = [];
    const hateScore = 0;
    const violenceParameters = [];
    const violenceScore = 0;
    const sexuallyExplicitParameters = [];
    const sexuallyExplicitScore = 0;
    
export async function checkOpenAIModeration(text) {


    const moderation = await openai.moderations.create({ input: question });

    const scores = moderation.results[0].category_scores;

    for (const key in moderation.results[0].category_scores) {
        //console.log(key, moderation.results[0].category_scores[key]);
        if (moderation.results[0].category_scores[key] > threshold) {
            let flagged = true;
        }
    }

    let hateSpeechParameters = [moderation.results[0].category_scores.hate, moderation.results[0].category_scores.harassment, moderation.results[0].category_scores["hate/threatening"], moderation.results[0].category_scores["harassment/threatening"]];
    let hateScore = 1 - hateSpeechParameters.values().reduce((acc, x) => acc * (1 - x), 1);
    //This is the product-based approach

    let violenceParameters = [moderation.results[0].category_scores.violence, moderation.results[0].category_scores["violence/graphic"]];
    let violenceScore = 1 - violenceParameters.values().reduce((acc, x) => acc * (1 - x), 1);

    let sexuallyExplicitParameters =[moderation.results[0].category_scores.sexual, moderation.results[0].category_scores["sexual/minors"]];
    let sexuallyExplicitScore = 1 - sexuallyExplicitParameters.values().reduce((acc, x) => acc * (1 - x), 1);

    console.log(scores);

    return scores;
}

// Perspective API Function (copied from perspective.js)
export async function analyzeText(text) {
    const body = {
        comment: { text },
        languages: ["en"],
        requestedAttributes: {
            TOXICITY: {},           // type of stuff that causes people to leave a system
            SEVERE_TOXICITY: {},
            IDENTITY_ATTACK: {},
            INSULT: {},
            THREAT: {},     // violence 
            PROFANITY: {},
            SEXUALLY_EXPLICIT: {},
            FLIRTATION: {}, // test against sexually explicit
            OBSCENE: {},        // vulgar language
            SPAM: {},
        },
    };

    const response = await fetch(PERSPECTIVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const result = await response.json();
    // Only print category and summaryScore.value for categories above the threshhold
    if (result && result.attributeScores) {
        let found = false;
        for (const [category, data] of Object.entries(result.attributeScores)) {
            if (data.summaryScore && data.summaryScore.value > 0.0) {
                console.log(`${category}: ${data.summaryScore.value}`);
                found = true;
            }
        }
        if (!found) {
            console.log("No categories above 0.2 score value.");
        }
    } else {
        console.log("No attributeScores found in response.");
    }
}

// Google Safe Browsing Function
export async function checkUrlSafety(url) {
    try {
        const SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
        const SAFE_BROWSING_API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
        
        const requestBody = {
            client: {
                clientId: "SafeLink-Extension",
                clientVersion: "1.0.0"
            },
            threatInfo: {
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: [{ url: url }]
            }
        };

        const response = await fetch(`${SAFE_BROWSING_API_URL}?key=${SAFE_BROWSING_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const isUnsafe = data.matches && data.matches.length > 0;
        
        return {
            success: true,
            isUnsafe,
            threats: data.matches || [],
            url: url
        };
    } catch (error) {
        console.error('Safe Browsing API error:', error);
        return {
            success: false,
            isUnsafe: false,
            threats: [],
            url: url,
            error: error.message
        };
    }
}
