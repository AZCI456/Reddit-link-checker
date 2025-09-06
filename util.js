// Probability union function for combining probabilities
export function probabilityUnion(arr) {
    if (!arr.length) return 0;
    return 1 - arr.reduce((acc, x) => acc * (1 - x), 1);
}
