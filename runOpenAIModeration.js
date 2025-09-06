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
    for (const key in moderation.results[0].category_scores) {
        if (moderation.results[0].category_scores[key] > THRESHOLD) {
            let flagged = true;
        }
    }
    let hateSpeechParameters = [moderation.results[0].category_scores.hate, moderation.results[0].category_scores.harassment, moderation.results[0].category_scores["hate/threatening"], moderation.results[0].category_scores["harassment/threatening"]];
    let hateScore = 1 - hateSpeechParameters.values().reduce((acc, x) => acc * (1 - x), 1);
    let violenceParameters = [moderation.results[0].category_scores.violence, moderation.results[0].category_scores["violence/graphic"]];
    let violenceScore = 1 - violenceParameters.values().reduce((acc, x) => acc * (1 - x), 1);
    let sexuallyExplicitParameters =[moderation.results[0].category_scores.sexual, moderation.results[0].category_scores["sexual/minors"]];
    let sexuallyExplicitScore = 1 - sexuallyExplicitParameters.values().reduce((acc, x) => acc * (1 - x), 1);
    console.log(scores);
    return scores;
}
