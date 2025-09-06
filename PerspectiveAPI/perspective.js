// perspective.js
import fetch from "node-fetch"; // If Node 18+, you can use global fetch
import dotenv from 'dotenv';
dotenv.config();

// get the API key from the .env file
const API_KEY = process.env.PERSPECTIVE_API_KEY;
const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`;

async function analyzeText(text) {
  const body = {
    comment: { text },
    languages: ["en"],
    requestedAttributes: {
    TOXICITY: {},           // type of stuff that causes people to leave a system
    SEVERE_TOXICITY: {},
    IDENTITY_ATTACK: {},
    INSULT: {},
    THREAT: {},     // violence 
    PROFANITY: {},
    SEXUALLY_EXPLICIT: {},
    FLIRTATION: {}, // test against sexually explicit
    OBSCENE: {},        // vulgar language
    SPAM: {},
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  // Only print category and summaryScore.value for categories above the threshhold
  if (result && result.attributeScores) {
    let found = false;
    for (const [category, data] of Object.entries(result.attributeScores)) {
      if (data.summaryScore && data.summaryScore.value > 0.0) {
        console.log(`${category}: ${data.summaryScore.value}`);
        found = true;
      }
    }
    if (!found) {
      console.log("No categories above 0.2 score value.");
    }
  } else {
    console.log("No attributeScores found in response.");
  }
}

// file path stuff 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module (defo not chat gpt)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// get the file path
const filePath = path.join(__dirname, 'perp_test.txt');
fs.readFile(filePath, 'utf8', (err, data) => {
    // can remove the error testing for loop testing
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  analyzeText(data);
});
