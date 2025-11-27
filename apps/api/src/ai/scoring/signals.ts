export function readability(text: string) {
  const length = Math.max(1, text.length);
  return Math.max(0, Math.min(1, 1 - length / 2500));
}

export function coverage(text: string) {
  const sentences = text.split(/[.!?\n]+/).filter(Boolean).length;
  return Math.max(0, Math.min(1, sentences / 25));
}

export function brandFit(_text: string) {
  return 0.8;
}

export function seoScore(_text: string) {
  return 0.7;
}
