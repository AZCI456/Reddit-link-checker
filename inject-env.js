// Simple script to inject API key from .env into background.js
require('dotenv').config();
const fs = require('fs');

// Read background.js
let content = fs.readFileSync('background.js', 'utf8');

// Replace placeholder with actual API key
content = content.replace('YOUR_API_KEY_HERE', process.env.GOOGLE_SAFE_BROWSING_API_KEY);

// Write back
fs.writeFileSync('background.js', content);

console.log('API key injected!!!');
