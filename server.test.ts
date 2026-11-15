import { expect, it, vi } from "vitest";
import plugin from "./server.js";
import type { HostApi } from "./host.js";
it("reads through host APIs, bounds history and rejects invalid thread targets", async () => {
  const handlers = new Map<string, (v?: unknown) => unknown>();
  const list = vi.fn(async () => [
    { id: "a", title: "Named" },
    { id: "b", titleFallback: "Fallback" },
    { id: "c" },
  ]);
  const get = vi.fn(async ({ threadId }: { threadId: string }) =>
    threadId === "missing" ? null : { id: threadId, titleFallback: "Thread" },
  );
  const events = vi.fn(async () => []);
  plugin({
    rpc: {
      method: (name: string, fn: (v?: unknown) => unknown) =>
        handlers.set(name, fn),
    },
    sdk: { threads: { list, get, events: { list: events } } },
  } as unknown as HostApi);
  expect(await handlers.get("threads")!()).toEqual([
    { id: "a", title: "Named" },
    { id: "b", title: "Fallback" },
    { id: "c", title: "c" },
  ]);
  expect(list).toHaveBeenCalledWith({ limit: 100, archived: false });
  expect(await handlers.get("trace")!({ threadId: "a" })).toMatchObject({
    thread: { id: "a", title: "Thread" },
    steps: [],
  });
  expect(events).toHaveBeenCalledWith({
    threadId: "a",
    limit: 500,
    order: "asc",
  });
  for (const input of [
    undefined,
    {},
    [],
    { threadId: "" },
    { threadId: " " },
    { threadId: "x".repeat(201) },
  ])
    await expect(handlers.get("trace")!(input)).rejects.toThrow("required");
  await expect(handlers.get("trace")!({ threadId: "missing" })).rejects.toThrow(
    "not found",
  );
  get.mockResolvedValueOnce({ id: "a", title: "Title" } as never);
  await expect(
    handlers.get("trace")!({ threadId: "a" }),
  ).resolves.toMatchObject({ thread: { title: "Title" } });
  get.mockResolvedValueOnce({ id: "a" } as never);
  await expect(
    handlers.get("trace")!({ threadId: "a" }),
  ).resolves.toMatchObject({ thread: { title: "a" } });
});
