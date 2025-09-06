import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;
const PERSPECTIVE_URL = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`;
const THRESHOLD = 0.2;

export async function runPerspective(text) {
    const body = {
        comment: { text },
        languages: ["en"],
        requestedAttributes: {
            TOXICITY: {},
            SEVERE_TOXICITY: {},
            IDENTITY_ATTACK: {},
            INSULT: {},
            THREAT: {},
            PROFANITY: {},
            SEXUALLY_EXPLICIT: {},
            FLIRTATION: {},
            OBSCENE: {},
            SPAM: {},
        },
    };
    const response = await fetch(PERSPECTIVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const result = await response.json();
    if (result && result.attributeScores) {
        let found = false;
        for (const [category, data] of Object.entries(result.attributeScores)) {
            if (data.summaryScore && data.summaryScore.value > THRESHOLD) {
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
