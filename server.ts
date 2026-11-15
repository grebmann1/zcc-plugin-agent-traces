import type { HostApi } from "./host.js";
import { trace, record, type Row } from "./model.js";
export default function plugin(zcc: HostApi) {
  zcc.rpc.method("threads", async () =>
    (await zcc.sdk.threads.list({ limit: 100, archived: false })).map((t) => ({
      id: t.id,
      title: t.title || t.titleFallback || t.id,
    })),
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
      order: "asc",
    });
    return {
      thread: {
        id: thread.id,
        title: thread.title || thread.titleFallback || thread.id,
      },
      ...trace(rows as Row[]),
    };
  });
}
