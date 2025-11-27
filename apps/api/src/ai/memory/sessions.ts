const sessions = new Map<string, { messages: string[] }>();

export function appendSession(key: string, message: string) {
  const session = sessions.get(key) ?? { messages: [] };
  session.messages.push(message);
  if (session.messages.length > 20) session.messages.shift();
  sessions.set(key, session);
  return session;
}

export function getSession(key: string) {
  return sessions.get(key) ?? { messages: [] };
}
