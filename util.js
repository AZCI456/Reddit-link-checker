// Probability union function for combining probabilities
console.log('util.js loaded, defining window functions');
window.probabilityUnion = function probabilityUnion(arr) {
    if (!arr.length) return 0;
    return 1 - arr.reduce((acc, x) => acc * (1 - x), 1);
};

window.calculateMean = function calculateMean(arr) {
  if (arr.length === 0) {
    return 0; // Or handle as an error, depending on requirements
  }
  const sum = arr.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  return sum / arr.length;
};

