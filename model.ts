export type Row = {
  seq: number;
  type: string;
  payload: unknown;
  createdAt?: number;
};
export type Step = {
  id: string;
  parentId: string | null;
  name: string;
  kind: string;
  startSeq: number;
  endSeq: number | null;
  durationMs: number | null;
  status: string;
  detail: string;
};
export const record = (x: unknown): Record<string, unknown> =>
  x !== null && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : {};
export function text(x: unknown, limit = 6000): string {
  if (x === undefined) return "";
  let s: string;
  try {
    s = typeof x === "string" ? x : JSON.stringify(x);
  } catch {
    return "[unavailable]";
  }
  return s.length > limit ? s.slice(0, limit) + "\n[truncated]" : s;
}
export function trace(rows: Row[]) {
  const steps = new Map<string, Step>();
  const started = new Map<string, number>();
  for (const row of [...rows].sort((a, b) => a.seq - b.seq)) {
    const p = record(row.payload);
    const item = record(p.item);
    const scope = record(p.scope);
    const kind = typeof item.type === "string" ? item.type : "";
    if (
      !row.type.startsWith("item/") ||
      typeof item.id !== "string" ||
      [
        "userMessage",
        "agentMessage",
        "reasoning",
        "plan",
        "planSteps",
      ].includes(kind)
    )
      continue;
    if (
      ![
        "item/started",
        "item/completed",
        "item/backgroundTask/completed",
        "item/delegation/completed",
      ].includes(row.type)
    )
      continue;
    const parent =
      typeof item.parentToolCallId === "string"
        ? item.parentToolCallId
        : typeof p.parentToolCallId === "string"
          ? p.parentToolCallId
          : null;
    const turn = typeof scope.turnId === "string" ? scope.turnId : "unscoped";
    const id = turn + ":" + item.id;
    const old = steps.get(id);
    const done = row.type !== "item/started";
    if (
      !done &&
      typeof row.createdAt === "number" &&
      Number.isFinite(row.createdAt)
    )
      started.set(id, row.createdAt);
    const time = started.get(id);
    const status = done
      ? item.status === "failed" || item.error
        ? "failed"
        : item.status === "interrupted"
          ? "interrupted"
          : "completed"
      : "running";
    const name = text(
      item.tool || item.command || item.path || item.label || kind || "Tool",
      180,
    );
    steps.set(id, {
      id,
      parentId: parent ? turn + ":" + parent : null,
      name,
      kind,
      startSeq: old?.startSeq ?? row.seq,
      endSeq: done ? row.seq : null,
      durationMs:
        done && time !== undefined && row.createdAt !== undefined
          ? Math.max(0, row.createdAt - time)
          : null,
      status,
      detail: text(
        item.aggregatedOutput ??
          item.output ??
          item.result ??
          item.error ??
          item.arguments ??
          item.command ??
          item,
      ),
    });
  }
  const all = [...steps.values()];
  return {
    steps: all.slice(-200),
    truncated:
      rows.length >= 500 ||
      (rows.length > 0 && Math.min(...rows.map((r) => r.seq)) > 1) ||
      all.length > 200,
    eventCount: rows.length,
    axis: all.some((s) => s.durationMs !== null) ? "duration" : "sequence",
  };
}
