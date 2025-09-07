// Browser-compatible OpenAI client
const OPENAI_API_KEY = "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";
const OPENAI_URL = 'https://api.openai.com/v1/moderations';

const THRESHOLD = 0.2;

// Probability union function (copied from util.js)
function probabilityUnion(probabilities) {
    if (probabilities.length === 0) return 0;
    if (probabilities.length === 1) return probabilities[0];
    
    // Union probability: 1 - (1-p1)(1-p2)...(1-pn)
    let product = 1;
    for (const p of probabilities) {
        product *= (1 - p);
    }
    return 1 - product;
}

// Make function globally available
console.log('runOpenAIModeration.js loaded, defining window.runOpenAIModeration');
window.runOpenAIModeration = async function runOpenAIModeration(text) {
    // Use fetch instead of OpenAI client
    const response = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: text })
    });
    
    const moderation = await response.json();
    
    // Check if the response is valid
    if (!response.ok) {
        console.error('OpenAI API error:', response.status, response.statusText);
        console.error('Error response:', moderation);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    if (!moderation || !moderation.results || !moderation.results[0] || !moderation.results[0].category_scores) {
        console.error('OpenAI API response invalid:', moderation);
        throw new Error('Invalid OpenAI API response structure');
    }
    
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
};
