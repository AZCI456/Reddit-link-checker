import { runOpenAIModeration, runPerspective } from './index.js';

async function analyzeText(text){
  
    runOpenAIModeration(text);
    console.log("1 done");
    runPerspective(text);
    console.log("2 done")

  
}





import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Always scan test cases in PerspectiveAPI/test_cases
const testCaseName = 'perp_test.txt'; // Change this to use a different test case
const testFilePath = path.join(__dirname, 'PerspectiveAPI', 'test_cases', testCaseName);

fs.readFile(testFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading test file:', err);
    return;
  }
  analyzeText(data).then(result => {
    console.log('Analysis result:', result);
  });
});