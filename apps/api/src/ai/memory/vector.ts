export async function embed(text: string): Promise<number[]> {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return [hash % 101 / 100, (hash >> 1) % 101 / 100, (hash >> 2) % 101 / 100];
}

export async function search(_query: string, k = 3) {
  return Array.from({ length: k }, (_, index) => ({
    id: `doc_${index}`,
    score: parseFloat((1 - index * 0.1).toFixed(2)),
  }));
}
