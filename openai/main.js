import OpenAI from "openai";
import dotenv from "dotenv";
import fs from 'fs';

dotenv.config({
    path: '.env',
    override: true});

const { OPENAI_API_KEY } = process.env;
const question = fs.readFileSync('./test.txt', 'utf-8');
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});
const threshold= 0.2;
const flagged = false;
const hateSpeechParameters = [];
const hateScore= 0;
const violenceParameters =[];
const violenceScore = 0;
const sexuallyExplicitParameters= [];
const sexuallyExplicitScore =0;


async function runOpenAI() {
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
}
runOpenAI();