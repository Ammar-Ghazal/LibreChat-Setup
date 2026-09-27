const stopWords = new Set(
  'a an and are as at be by for from how in is it of on or that the this to was what when where which who with www https com site'.split(
    ' ',
  ),
);

function words(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}+#]+/gu) ?? []).filter(
    (word) => word.length > 1 && !stopWords.has(word),
  );
}

/** Lexical BM25 ranking; scores indicate word relevance, never factual confidence. */
export function rank(query: string, documents: string[], count: number) {
  const terms = [...new Set(words(query))];
  const tokens = documents.map(words);
  const average = tokens.reduce((sum, item) => sum + item.length, 0) / (tokens.length || 1) || 1;
  const frequency = new Map<string, number>();
  for (const document of tokens) {
    for (const term of new Set(document)) {
      frequency.set(term, (frequency.get(term) ?? 0) + 1);
    }
  }
  return tokens
    .map((document, index) => {
      const counts = new Map<string, number>();
      for (const word of document) counts.set(word, (counts.get(word) ?? 0) + 1);
      let score = 0;
      for (const term of terms) {
        const hits = counts.get(term) ?? 0;
        const df = frequency.get(term) ?? 0;
        const idf = Math.log(1 + (documents.length - df + 0.5) / (df + 0.5));
        score += (idf * hits * 2.2) / (hits + 1.2 * (0.25 + (0.75 * document.length) / average));
      }
      return { index, relevance_score: score, document: { text: documents[index] } };
    })
    .sort((a, b) => b.relevance_score - a.relevance_score || a.index - b.index)
    .slice(0, Math.max(0, count));
}

export function passages(content: string, size: number) {
  const result: { start: number; end: number; text: string }[] = [];
  for (let start = 0; start < content.length; start += size) {
    const end = Math.min(content.length, start + size);
    result.push({ start, end, text: content.slice(start, end) });
  }
  return result;
}
