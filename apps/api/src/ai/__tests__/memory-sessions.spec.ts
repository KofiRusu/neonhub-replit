describe("ai memory sessions", () => {
  let appendSession: (key: string, msg: string) => unknown;
  let getSession: (key: string) => { messages: string[] };

  beforeEach(async () => {
    jest.resetModules();
    const module = await import("../memory/sessions");
    appendSession = module.appendSession;
    getSession = module.getSession;
  });

  it("initialises an empty session by default", () => {
    const session = getSession("unknown");
    expect(session.messages).toEqual([]);
  });

  it("stores messages and trims to the last 20 entries", () => {
    for (let index = 0; index < 25; index += 1) {
      appendSession("agent-a", `message-${index}`);
    }

    const session = getSession("agent-a");
    expect(session.messages).toHaveLength(20);
    expect(session.messages[0]).toBe("message-5");
    expect(session.messages.at(-1)).toBe("message-24");
  });
});
