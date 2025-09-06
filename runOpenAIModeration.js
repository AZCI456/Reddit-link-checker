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
    const discrimination_pr = probabilityUnion([
        scores.hate, scores["hate/threatening"],
        scores.harassment, scores["harassment/threatening"]
    ]);

    const nsfw_pr = probabilityUnion([scores.sexual, scores["sexual/minors"]]);
    const violence_pr = probabilityUnion([scores.violence, scores["violence/graphic"]]);
    const hateSpeech_pr = probabilityUnion([scores.hate, scores["hate/threatening"]]);
    const aiSlop_pr = 0; // placeholder


    // calculated by the union between all the categories - higher is worse
    const safetyScore_pr = probabilityUnion([discrimination_pr, nsfw_pr, violence_pr, hateSpeech_pr, aiSlop_pr]);


    const message = `Calculated Attribute Scores OAI METHOD:
    - Discrimination: ${discrimination_pr}
    - NSFW: ${nsfw_pr}
    - Violence: ${violence_pr}
    - Hate Speech: ${hateSpeech_pr}
    - AI Slop: ${aiSlop_pr}
    - safetyScore: ${safetyScore_pr}`; 

    console.log(message);

    return {
        discrimination: discrimination_pr,
        nsfw: nsfw_pr,
        violence: violence_pr,
        hateSpeech: hateSpeech_pr,
        aiSlop: aiSlop_pr,
        safetyScore: safetyScore_pr
    };
}
