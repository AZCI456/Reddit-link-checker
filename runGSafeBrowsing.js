import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export async function runGSafeBrowsing(url) {
    try {
        const SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
        const SAFE_BROWSING_API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
        const requestBody = {
            client: {
                clientId: "SafeLink-Extension",
                clientVersion: "1.0.0"
            },
            threatInfo: {
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: [{ url: url }]
            }
        };
        const response = await fetch(`${SAFE_BROWSING_API_URL}?key=${SAFE_BROWSING_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const isUnsafe = data.matches && data.matches.length > 0;
        return {
            success: true,
            isUnsafe,
            threats: data.matches || [],
            url: url
        };
    } catch (error) {
        console.error('Safe Browsing API error:', error);
        return {
            success: false,
            isUnsafe: false,
            threats: [],
            url: url,
            error: error.message
        };
    }
}
