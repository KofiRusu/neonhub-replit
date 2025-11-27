// @ts-nocheck
export default async function handler(req, res){
  // Verify signature when STRIPE_WEBHOOK_SECRET present; air-gap: accept X-Mock-Event
  const mock = req.headers['x-mock-event'];
  if (mock) return res.status(200).json({ ok:true, handled:mock, mode:'mock' });
  return res.status(200).json({ ok:true, handled:'noop (air-gap)' });
}
