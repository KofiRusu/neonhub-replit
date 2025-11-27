export function toVectorSql(vector: number[]): string {
  if (!vector.length) {
    return "ARRAY[0]::vector";
  }

  const safe = vector.map((value) => (Number.isFinite(value) ? Number(value) : 0));
  return `ARRAY[${safe.join(", ")}]::vector`;
}
