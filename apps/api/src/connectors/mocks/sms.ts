type MockSmsMessage = {
  sid: string;
  to: string;
  from: string;
  status: "queued" | "sent" | "delivered" | "failed";
  body: string;
};

const mockMessages: MockSmsMessage[] = [
  {
    sid: "SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    to: "+15551231234",
    from: "+15550987654",
    status: "delivered",
    body: "Welcome to NeonHub! Reply STOP to unsubscribe.",
  },
  {
    sid: "SMYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
    to: "+15557654321",
    from: "+15550987654",
    status: "queued",
    body: "Your weekly performance report is ready.",
  },
];

export function sendMockSms(body: Pick<MockSmsMessage, "to" | "body"> & { from?: string }) {
  const sid = `SM${Math.random().toString(16).slice(2, 34).padEnd(32, "0")}`;
  const message: MockSmsMessage = {
    sid,
    to: body.to,
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

export function listMockSmsMessages() {
  return mockMessages.slice(0, 20);
}
