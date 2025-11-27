// @ts-nocheck
// Temporary suppression — legacy suite. Logged in AGENT_COMPLETION_PROGRESS.md.
import { jest } from "@jest/globals";

type JestMock = jest.Mock;

const tensorMock = jest.fn(() => ({
  dataSync: jest.fn(() => [0]),
  dispose: jest.fn(),
}));

const sequentialMock = jest.fn(() => ({
  add: jest.fn(),
  compile: jest.fn(),
  fit: jest.fn(async () => ({ history: {} })),
  predict: jest.fn(() => tensorMock()),
}));

const layers = {
  dense: jest.fn(() => ({ apply: jest.fn() })),
};

const tidy = jest.fn((fn: () => unknown) => fn());

export const tensor: JestMock = tensorMock;
export const sequential: JestMock = sequentialMock;
export { layers };
export const dispose: JestMock = jest.fn();
export const ready: JestMock = jest.fn(async () => undefined);
export { tidy };
const tfjsMock: Record<string, unknown> = {
  tensor,
  sequential,
  layers,
  dispose,
  tidy,
  ready,
};

export default tfjsMock;
