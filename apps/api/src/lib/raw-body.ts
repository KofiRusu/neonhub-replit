import type { NextApiRequest } from 'next'

export async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  // If body was already read and attached (e.g., by custom middleware)
  // @ts-ignore
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) return req.rawBody as Buffer

  const chunks: Buffer[] = []
  // @ts-ignore
  const readable = req as unknown as NodeJS.ReadableStream
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}
