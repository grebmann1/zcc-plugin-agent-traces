import { useState } from "react";
import { definePluginApp } from "@zana-ai/zcc-plugin-sdk/app";
import type { PluginThreadPanelProps } from "@zana-ai/zcc-plugin-sdk/app";
import { Frame, Notice, control, useData, usePage } from "./ui.js";
import type { trace } from "./model.js";
type Trace = ReturnType<typeof trace> & { thread: { title: string } };
export function TraceView({ threadId }: { threadId: string }) {
  const { data, error, pending, reload } = useData<Trace>("trace", {
    threadId,
  });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  usePage("Agent Traces", threadId);
  const step = data?.steps.find((s) => s.id === selected);
  const visible = data?.steps.filter((s) =>
    (s.name + " " + s.kind).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <p>{data?.thread.title}</p>
      <button style={control} onClick={reload}>
        Refresh trace
      </button>
      <Notice pending={pending} error={error} />
      {data && (
        <>
          <p>
            {data.eventCount} recorded events · {data.steps.length} steps
          </p>
          <p>
            {data.axis === "sequence"
              ? "Event order · timestamps unavailable in this host SDK"
              : "Available durations shown per step"}
          </p>
          {data.truncated && (
            <p role="status">
              Partial history: this view is bounded to 500 recent events and 200
              steps.
            </p>
          )}
          <input
            aria-label="Filter steps"
            style={control}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter tools and commands"
          />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 16,
            }}
          >
            <section style={{ flex: "1 1 240px", minWidth: 0 }}>
              {visible?.length === 0 && <p>No matching recorded steps.</p>}
              {visible?.map((s) => (
                <button
                  key={s.id}
                  style={{
                    ...control,
                    display: "block",
                    textAlign: "left",
                    width: "100%",
                    marginBottom: 8,
                    overflowWrap: "anywhere",
                    background:
                      s.id === selected
                        ? "var(--bg-selected,#454062)"
                        : control.background,
                  }}
                  onClick={() => setSelected(s.id)}
                >
                  <strong>{s.name}</strong>
                  <br />
                  <small>
                    {s.status} · #{s.startSeq}
                    {s.durationMs !== null ? ` · ${s.durationMs} ms` : ""}
                  </small>
                </button>
              ))}
            </section>
            <aside style={{ flex: "1 1 240px", minWidth: 0 }}>
              {step ? (
                <>
                  <h3>{step.name}</h3>
                  <p>
                    {step.status} · parent {step.parentId ?? "current turn"}
                  </p>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      fontSize: 12,
                    }}
                  >
                    {step.detail}
                  </pre>
                </>
              ) : (
                <p>Select a step to inspect its available output.</p>
              )}
            </aside>
          </div>
        </>
      )}
    </>
  );
}
export function Panel({ threadId }: { threadId?: string }) {
  const { data, error, pending } = useData<
    Array<{ id: string; title: string }>
  >("threads", {});
  const [chosen, setChosen] = useState("");
  const id = threadId || chosen;
  usePage("Agent Traces", id || undefined);
  return (
    <Frame title="Agent Traces">
      {!threadId && (
        <>
          <label>
            Thread{" "}
            <select
              aria-label="Thread"
              style={control}
              value={chosen}
              onChange={(e) => setChosen(e.target.value)}
            >
              <option value="">Choose a thread</option>
              {data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <Notice pending={pending} error={error} />
          {data?.length === 0 && <p>No threads yet.</p>}
        </>
      )}
      {id ? (
        <TraceView key={id} threadId={id} />
      ) : (
        <p>Choose a thread to inspect its recorded steps.</p>
      )}
    </Frame>
  );
}
export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "main",
    title: "Agent Traces",
    icon: "Activity",
    placement: "extensions",
    component: Panel,
  });
  app.slots.threadPanelAction({
    id: "trace",
    title: "Agent Traces",
    icon: "Activity",
    component: (p: PluginThreadPanelProps) => <Panel threadId={p.threadId} />,
  });
});
