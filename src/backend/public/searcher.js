(function (global) {
    const searcher = {
        match(rawPattern, corpus, prefix = '', postfix = '') {
            const result = [];
            const { length } = corpus;
            const pattern = rawPattern.toLocaleLowerCase();
            let totalScore = 0;
            let currentScore = 0;
            let character;
            let patternIdx = 0;
            for (let i = 0; i < length; i++) {
                character = corpus[i];
                if (corpus[i].toLocaleLowerCase() === pattern[patternIdx]) {
                    const isConsecutiveOrWordBoundary = 
                    // Consequtive
                    currentScore !== 0 ||
                        // Word boundary
                        i === 0 ||
                        // Word boundary
                        corpus[i - 1].match(/[^\w]|_/);
                    if (isConsecutiveOrWordBoundary) {
                        character = prefix + character + postfix;
                        currentScore += 1 + currentScore;
                        patternIdx += 1;
                    }
                }
                else {
                    currentScore = 0;
                }
                totalScore += currentScore;
                if (totalScore >= Number.MAX_SAFE_INTEGER) {
                    throw new Error('Score Exceeded Safe Values, Corpus Too Big');
                }
                result.push(character);
            }
            if (patternIdx === pattern.length) {
                // On exact match set score to max value
                totalScore = corpus === pattern ? Number.MAX_SAFE_INTEGER : totalScore;
                return {
                    rendered: result.join(''),
                    score: totalScore
                };
            }
            return {
                rendered: corpus,
                score: 0
            };
        },
        score(pattern, tuples, prefix = '', postfix = '') {
            return tuples
                .reduce((acc, tuple) => {
                const [corpus] = tuple;
                const result = searcher.match(pattern, corpus, prefix, postfix);
                acc.push({
                    rendered: result.rendered,
                    score: result.score,
                    tuple,
                });
                return acc;
            }, [])
                .sort((a, b) => {
                const result = b.score - a.score;
                return result ? result : b.tuple[0].localeCompare(a.tuple[0]);
            });
        }
    };
    global.searcher = searcher;
}(this));
