import fetch from "node-fetch";
import dotenv from "dotenv";
import { probabilityUnion } from "./util.js";
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
    if (!result || !result.attributeScores) {
        return {
            discrimination: 0,
            nsfw: 0,
            violence: 0,
            hateSpeech: 0,
            aiSlop: 0
        };
    }

    const scores = result.attributeScores;
    // Discrimination: hate, hate/threatening, harassment, harassment/threatening (map to IDENTITY_ATTACK, INSULT, SEVERE_TOXICITY, TOXICITY)
    const discrimination = probabilityUnion([
        scores.IDENTITY_ATTACK?.summaryScore.value || 0,
        scores.INSULT?.summaryScore.value || 0,
        scores.SEVERE_TOXICITY?.summaryScore.value || 0,
        scores.TOXICITY?.summaryScore.value || 0
    ]);
    // NSFW: sexual, sexual/minors (map to SEXUALLY_EXPLICIT, OBSCENE, PROFANITY, FLIRTATION)
    const nsfw = probabilityUnion([
        scores.SEXUALLY_EXPLICIT?.summaryScore.value || 0,
        scores.OBSCENE?.summaryScore.value || 0,
        scores.PROFANITY?.summaryScore.value || 0,
        scores.FLIRTATION?.summaryScore.value || 0
    ]);
    // Violence: violence, violence/graphic (map to THREAT, SEVERE_TOXICITY)
    const violence = probabilityUnion([
        scores.THREAT?.summaryScore.value || 0,
        scores.SEVERE_TOXICITY?.summaryScore.value || 0
    ]);
    // Hate speech: hate, hate/threatening (map to TOXICITY, IDENTITY_ATTACK)
    const hateSpeech = probabilityUnion([
        scores.TOXICITY?.summaryScore.value || 0,
        scores.IDENTITY_ATTACK?.summaryScore.value || 0
    ]);
    // AI Slop: not available, stub
    const aiSlop = 0;

    const message = `Calculated Attribute Scores PERSPECTIVE API:
    - Discrimination: ${discrimination}
    - NSFW: ${nsfw}
    - Violence: ${violence}
    - Hate Speech: ${hateSpeech}
    - AI Slop: ${aiSlop}`; 

    console.log(message);


    return {
        discrimination,
        nsfw,
        violence,
        hateSpeech,
        aiSlop
    };
}
