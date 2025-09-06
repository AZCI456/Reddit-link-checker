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

    const result = {
        discrimination: {
            score: aggregateScore(discriminationScores),
            isDiscriminatory: aggregateScore(discriminationScores) > THRESHOLD
        },
        nsfw: {
            score: aggregateScore(nsfwScores),
            isNSFW: aggregateScore(nsfwScores) > THRESHOLD
        },
        violence: {
            score: aggregateScore(violenceScores),
            isViolent: aggregateScore(violenceScores) > THRESHOLD
        },
        hateSpeech: {
            score: aggregateScore(hateSpeechScores),
            isHateful: aggregateScore(hateSpeechScores) > THRESHOLD
        },
        aiSlop: {
            score: 0, // stub
            isAISlop: false
        }
    };

    console.log(result);

    // Safety score = 1 - (product of safety)
    const safetyScore = 1 - [
        result.discrimination.score,
        result.nsfw.score,
        result.violence.score,
        result.hateSpeech.score,
        result.aiSlop.score
    ].reduce((acc, x) => acc * (1 - x), 1);

    return { ...result, safetyScore };
}
