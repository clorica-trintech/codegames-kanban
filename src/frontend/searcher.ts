type MatchResult = {
  value: string;
  score: number;
};

type ScoreResult = MatchResult & {
  tuple: [string, any];
};

type Searcher = {
  match(pattern: string, 
    corpus: string, 
    prefix: string, 
    postfix: string): MatchResult;
  score(pattern: string, 
    tuples: [string, any][], 
    prefix?: string, 
    postfix?: string): ScoreResult[];
};

(function (global) {
  const searcher: Searcher = {
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
          // If this is a non-consequtive match ignore non-word boundaries
          const isConsecutiveOrWordBoundary =
            // Consequtive
            currentScore !== 0 ||
            // Word boundary
            i === 0 ||
            // Word boundary
            corpus[i - 1].match(/\s/);
          
          if (isConsecutiveOrWordBoundary) {
            character = prefix + character + postfix;
            currentScore += 1 + currentScore;
            patternIdx += 1;
          }

        } else {
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
          value: result.join(''), 
          score: totalScore
        };
      }

      return {
        value: corpus,
        score: 0
      };
    },
    score(pattern: string, tuples: [string, any][], prefix: string = '', postfix: string = '') {
      return tuples
        .reduce<ScoreResult[]>((acc, tuple) => {
          const [corpus] = tuple;
          const result = searcher.match(pattern, corpus, prefix, postfix);
          
          acc.push({
            value: result.value,
            score: result.score,
            tuple,
          });

          return acc;
        }, [])
        .sort((a, b) => {
          const result = b.score - a.score;
          return result ? result : b.value.localeCompare(a.value);
        });
    }
  };

  global.searcher = searcher;
}(this));

