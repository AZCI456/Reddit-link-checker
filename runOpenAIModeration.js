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

    const THRESHOLD = 0.2;

    // Map into categories
    const discriminationScores = [
        scores.hate, scores["hate/threatening"],
        scores.harassment, scores["harassment/threatening"]
    ];
    const nsfwScores = [scores.sexual, scores["sexual/minors"]];
    const violenceScores = [scores.violence, scores["violence/graphic"]];
    const hateSpeechScores = [scores.hate, scores["hate/threatening"]]; 
    const aiSlopScores = []; // placeholder

    function aggregateScore(arr) {
        if (!arr.length) return 0;
        // Probabilistic union (avoids double-counting when multiple are high)
        // reduce function takes accumilator and multiples by the value - 1 
        // should increase the value for a specific category
        return 1 - arr.reduce((acc, x) => acc * (1 - x), 1);
    }

    // result will contain the object as the key and the score as the value
    const result = {
        discrimination: 
            aggregateScore(discriminationScores)
        ,
        nsfw: 
            aggregateScore(nsfwScores)
        ,
        violence: 
            aggregateScore(violenceScores),
        hateSpeech: 
            aggregateScore(hateSpeechScores)
        ,
        aiSlop: 
            0, // method stub val implement later
        
    };

    console.log(result);

    // Safety score - probabilistic union of all the values: closer to 1 = worse
    const safetyScore = 1 - [
        result.discrimination,
        result.nsfw,
        result.violence,
        result.hateSpeech,
        result.aiSlop
    ].reduce((acc, x) => acc * (1 - x), 1);

    console.log(safetyScore);

    return { ...result, safetyScore };
}
