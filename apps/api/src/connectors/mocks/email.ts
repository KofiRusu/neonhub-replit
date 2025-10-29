import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type EmailMessage = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  receivedAt: string;
};

const emailMessages: EmailMessage[] = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../fixtures/email/messages.json"), "utf-8")
);

export function listEmailMessages(): EmailMessage[] {
  return emailMessages;
}

export function sendEmail(): { id: string; threadId: string } {
  return {
    id: `mock_${Date.now()}`,
    threadId: `thread_${Date.now()}`
  };
}
