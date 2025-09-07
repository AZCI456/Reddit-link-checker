// Browser-compatible Perspective API
console.log('runPerspective.js loaded, defining window.runPerspective');

const PERSPECTIVE_API_KEY= "AIzaSyAwql9YQ20CqaNCUOmjvRWTxTYSYMSm70s";

const PERSPECTIVE_URL = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`;

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
window.runPerspective = async function runPerspective(text) {
    const body = {
        comment: { text },
        languages: ["en"], // en-us
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
    
    if (!response.ok) {
        console.error('Perspective API error:', response.status, response.statusText);
        console.error('Error response:', result);
        throw new Error(`Perspective API error: ${response.status} ${response.statusText}`);
    }
    
    if (!result || !result.attributeScores) {
        console.error('Perspective API response invalid:', result);
        throw new Error('Invalid Perspective API response structure');
    }

    const scores = result.attributeScores;
    // Discrimination: hate, hate/threatening, harassment, harassment/threatening (map to IDENTITY_ATTACK, INSULT, SEVERE_TOXICITY, TOXICITY)
    const discrimination_pr = probabilityUnion([
        scores.IDENTITY_ATTACK?.summaryScore.value || 0,
        scores.INSULT?.summaryScore.value || 0,
        scores.SEVERE_TOXICITY?.summaryScore.value || 0,
        scores.TOXICITY?.summaryScore.value || 0
    ]);
    // NSFW: sexual, sexual/minors (map to SEXUALLY_EXPLICIT, OBSCENE, PROFANITY, FLIRTATION)
    const nsfw_pr = probabilityUnion([
        scores.SEXUALLY_EXPLICIT?.summaryScore.value || 0,
        scores.OBSCENE?.summaryScore.value || 0,
        scores.PROFANITY?.summaryScore.value || 0,
        scores.FLIRTATION?.summaryScore.value || 0
    ]);
    // Violence: violence, violence/graphic (map to THREAT, SEVERE_TOXICITY)
    const violence_pr = probabilityUnion([
        scores.THREAT?.summaryScore.value || 0,
        scores.SEVERE_TOXICITY?.summaryScore.value || 0
    ]);
    // Hate speech: hate, hate/threatening (map to TOXICITY, IDENTITY_ATTACK)
    const hateSpeech_pr = probabilityUnion([
        scores.TOXICITY?.summaryScore.value || 0,
        scores.IDENTITY_ATTACK?.summaryScore.value || 0
    ]);
    // AI Slop: not available, stub
    const aiSlop_pr = 0;

    // calculated by the union between all the categories - higher is worse
    const safetyScore_pr = probabilityUnion([discrimination_pr, nsfw_pr, violence_pr, hateSpeech_pr, aiSlop_pr]);

    const message = `Calculated Attribute Scores PERSPECTIVE API:
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
