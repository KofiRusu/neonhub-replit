// @ts-nocheck
export default async function handler(req, res){
  const provider = req.query?.provider || 'mock';
  return res.status(200).json({ ok:true, provider });
}
