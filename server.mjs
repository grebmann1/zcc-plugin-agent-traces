// model.ts
var record = (x) => x !== null && typeof x === "object" && !Array.isArray(x) ? x : {};
function text(x, limit = 6e3) {
  if (x === void 0) return "";
  let s;
  try {
    s = typeof x === "string" ? x : JSON.stringify(x);
  } catch {
    return "[unavailable]";
  }
  return s.length > limit ? s.slice(0, limit) + "\n[truncated]" : s;
}
function trace(rows) {
  const steps = /* @__PURE__ */ new Map();
  const started = /* @__PURE__ */ new Map();
  for (const row of [...rows].sort((a, b) => a.seq - b.seq)) {
    const p = record(row.payload);
    const item = record(p.item);
    const scope = record(p.scope);
    const kind = typeof item.type === "string" ? item.type : "";
    if (!row.type.startsWith("item/") || typeof item.id !== "string" || [
      "userMessage",
      "agentMessage",
      "reasoning",
      "plan",
      "planSteps"
    ].includes(kind))
      continue;
    if (![
      "item/started",
      "item/completed",
      "item/backgroundTask/completed",
      "item/delegation/completed"
    ].includes(row.type))
      continue;
    const parent = typeof item.parentToolCallId === "string" ? item.parentToolCallId : typeof p.parentToolCallId === "string" ? p.parentToolCallId : null;
    const turn = typeof scope.turnId === "string" ? scope.turnId : "unscoped";
    const id = turn + ":" + item.id;
    const old = steps.get(id);
    const done = row.type !== "item/started";
    if (!done && typeof row.createdAt === "number" && Number.isFinite(row.createdAt))
      started.set(id, row.createdAt);
    const time = started.get(id);
    const status = done ? item.status === "failed" || item.error ? "failed" : item.status === "interrupted" ? "interrupted" : "completed" : "running";
    const name = text(
      item.tool || item.command || item.path || item.label || kind || "Tool",
      180
    );
    steps.set(id, {
      id,
      parentId: parent ? turn + ":" + parent : null,
      name,
      kind,
      startSeq: old?.startSeq ?? row.seq,
      endSeq: done ? row.seq : null,
      durationMs: done && time !== void 0 && row.createdAt !== void 0 ? Math.max(0, row.createdAt - time) : null,
      status,
      detail: text(
        item.aggregatedOutput ?? item.output ?? item.result ?? item.error ?? item.arguments ?? item.command ?? item
      )
    });
  }
  const all = [...steps.values()];
  return {
    steps: all.slice(-200),
    truncated: rows.length >= 500 || rows.length > 0 && Math.min(...rows.map((r) => r.seq)) > 1 || all.length > 200,
    eventCount: rows.length,
    axis: all.some((s) => s.durationMs !== null) ? "duration" : "sequence"
  };
}

// server.ts
function plugin(zcc) {
  zcc.rpc.method(
    "threads",
    async () => (await zcc.sdk.threads.list({ limit: 100, archived: false })).map((t) => ({
      id: t.id,
      title: t.title || t.titleFallback || t.id
    }))
  );
  zcc.rpc.method("trace", async (input) => {
    const id = record(input).threadId;
    if (typeof id !== "string" || !id.trim() || id.length > 200)
      throw new Error("A thread is required");
    const thread = await zcc.sdk.threads.get({ threadId: id });
    if (!thread) throw new Error("Thread not found");
    const rows = await zcc.sdk.threads.events.list({
      threadId: id,
      limit: 500,
      order: "asc"
    });
    return {
      thread: {
        id: thread.id,
        title: thread.title || thread.titleFallback || thread.id
      },
      ...trace(rows)
    };
  });
}
export {
  plugin as default
};
