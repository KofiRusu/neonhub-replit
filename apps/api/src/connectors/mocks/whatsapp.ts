type MockWhatsAppMessage = {
  sid: string;
  to: string;
  from: string;
  status: "queued" | "sent" | "delivered" | "failed";
  body: string;
  templateName?: string;
};

const mockMessages: MockWhatsAppMessage[] = [
  {
    sid: "WAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    to: "whatsapp:+15551234567",
    from: "whatsapp:+15559876543",
    status: "delivered",
    body: "[en_US] onboarding_welcome: John Doe",
    templateName: "onboarding_welcome",
  },
  {
    sid: "WAYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
    to: "whatsapp:+15557654321",
    from: "whatsapp:+15559876543",
    status: "queued",
    body: "Hello from NeonHub support!",
  },
];

export function sendMockWhatsAppMessage(body: Pick<MockWhatsAppMessage, "to" | "body"> & { from?: string }) {
  const sid = `WA${Math.random().toString(16).slice(2, 34).padEnd(32, "0")}`;
  const message: MockWhatsAppMessage = {
    sid,
    to: body.to.startsWith("whatsapp:") ? body.to : `whatsapp:${body.to}`,
    from: body.from ?? mockMessages[0].from,
    status: "sent",
    body: body.body,
  };
  mockMessages.unshift(message);
  return {
    messageId: message.sid,
    status: message.status,
    to: message.to,
    from: message.from,
  };
}

export function listMockWhatsAppMessages() {
  return mockMessages.slice(0, 20);
}
