import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SlackMessage = {
  ts: string;
  text: string;
  user: string;
};

const slackMessages: SlackMessage[] = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../fixtures/slack/messages.json"), "utf-8")
);

export function listSlackMessages(): SlackMessage[] {
  return slackMessages;
}

export function sendSlackMessage(): { ts: string } {
  const timestamp = (Date.now() / 1000).toFixed(4);
  return { ts: timestamp };
}
