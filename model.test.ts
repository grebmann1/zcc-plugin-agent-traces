import { expect, it } from "vitest";
import { trace, text, record, type Row } from "./model.js";
const row = (
  seq: number,
  type: string,
  item: unknown,
  createdAt?: number,
): Row => ({
  seq,
  type,
  payload: { item, scope: { turnId: "turn" } },
  createdAt,
});
it("pairs bounded tool events, links parents and shows measured durations only when available", () => {
  const result = trace([
    row(
      3,
      "item/completed",
      { id: "tool", type: "toolCall", tool: "Read", output: "safe output" },
      145,
    ),
    row(1, "item/started", { id: "tool", type: "toolCall", tool: "Read" }, 100),
    row(2, "item/completed", {
      id: "child",
      type: "delegation",
      label: "Child",
      parentToolCallId: "tool",
    }),
  ]);
  expect(result.steps[0]).toMatchObject({
    name: "Read",
    startSeq: 1,
    endSeq: 3,
    status: "completed",
    durationMs: 45,
    detail: "safe output",
  });
  expect(result.steps[1].parentId).toBe("turn:tool");
  expect(result.steps[1].durationMs).toBeNull();
  expect(result.axis).toBe("duration");
  expect(result.truncated).toBe(false);
});
it("keeps same item ids in different turns separate and tolerates missing data", () => {
  const result = trace([
    row(1, "item/started", {
      id: "x",
      type: "commandExecution",
      command: "pwd",
    }),
    {
      seq: 2,
      type: "item/completed",
      payload: {
        scope: { turnId: "other" },
        item: { id: "x", type: "toolCall", tool: "Find", error: "Denied" },
      },
    },
    {
      seq: 3,
      type: "item/completed",
      payload: { item: { id: "x", path: "file", status: "interrupted" } },
    },
  ]);
  expect(result.steps).toHaveLength(3);
  expect(result.steps.map((s) => s.status)).toEqual([
    "running",
    "failed",
    "interrupted",
  ]);
  expect(result.axis).toBe("sequence");
});
it("ignores messages, deltas, malformed events and clips outputs", () => {
  const result = trace([
    { seq: 1, type: "turn/started", payload: {} },
    row(2, "item/started", { id: "x", type: "agentMessage" }),
    row(3, "item/tool/delta", { id: "x" }),
    { seq: 4, type: "item/started", payload: null },
    row(5, "item/started", { type: "toolCall" }),
    row(6, "item/completed", { id: "tool", arguments: "a".repeat(7000) }),
  ]);
  expect(result.steps).toHaveLength(1);
  expect(result.steps[0].detail).toContain("[truncated]");
  expect(result.steps[0].name).toBe("Tool");
});
it("marks windowed history, caps steps and never invents negative time", () => {
  expect(
    trace([row(4, "item/completed", { id: "x", result: { value: 1 } })])
      .truncated,
  ).toBe(true);
  expect(
    trace(
      Array.from({ length: 500 }, (_, i) =>
        row(i + 1, "item/completed", { id: String(i) }),
      ),
    ).steps,
  ).toHaveLength(200);
  expect(
    trace([
      row(1, "item/started", { id: "x" }, 20),
      row(2, "item/completed", { id: "x" }, 10),
    ]).steps[0].durationMs,
  ).toBe(0);
  expect(trace([])).toMatchObject({ eventCount: 0, truncated: false });
});
it("safely formats arbitrary or circular values", () => {
  expect(record([])).toEqual({});
  expect(record(4)).toEqual({});
  expect(text(undefined)).toBe("");
  const cycle: { self?: unknown } = {};
  cycle.self = cycle;
  expect(text(cycle)).toBe("[unavailable]");
});
