// @ts-nocheck
// Temporary suppression — legacy suite. Logged in AGENT_COMPLETION_PROGRESS.md.
import { jest } from "@jest/globals";

const pageMock = {
  goto: jest.fn(async () => undefined),
  content: jest.fn(async () => "<html></html>"),
  evaluate: jest.fn(async (fn: () => unknown) => (typeof fn === "function" ? fn() : null)),
  screenshot: jest.fn(async () => Buffer.from("")),
  close: jest.fn(async () => undefined),
};

const browserMock = {
  newPage: jest.fn(async () => pageMock),
  close: jest.fn(async () => undefined),
};

export const launch: jest.Mock = jest.fn(async () => browserMock);
const puppeteerMock: Record<string, unknown> = {
  launch,
};

export default puppeteerMock;
