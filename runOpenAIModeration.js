import { probabilityUnion } from './util.js';
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const THRESHOLD = 0.2;

export async function runOpenAIModeration(text) {
    const moderation = await openai.moderations.create({ input: text });
    const scores = moderation.results[0].category_scores;

    // Map into categories
    const discrimination = probabilityUnion([
        scores.hate, scores["hate/threatening"],
        scores.harassment, scores["harassment/threatening"]
    ]);

    const nsfw = probabilityUnion([scores.sexual, scores["sexual/minors"]]);
    const violence = probabilityUnion([scores.violence, scores["violence/graphic"]]);
    const hateSpeech = probabilityUnion([scores.hate, scores["hate/threatening"]]);
    const aiSlop = 0; // placeholder

    const message = `Calculated Attribute Scores OAI METHOD:
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
