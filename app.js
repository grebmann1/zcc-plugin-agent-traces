// host:react
var m = globalThis.__bbPluginRuntime?.react;
if (!m) throw new Error("Open this plugin in Zana");
var { useState, useEffect, useCallback, useRef, createElement, Fragment } = m;

// host:@zana-ai/zcc-plugin-sdk/app
var m2 = globalThis.__bbPluginRuntime?.pluginSdkApp;
if (!m2) throw new Error("Open this plugin in Zana");
var { definePluginApp, useRpc, useComposer, useZccNavigate } = m2;

// host:react/jsx-runtime
var m3 = globalThis.__bbPluginRuntime?.jsxRuntime;
if (!m3) throw new Error("Open this plugin in Zana");
var { jsx, jsxs, Fragment: Fragment2 } = m3;

// ui.tsx
var box = {
  height: "100%",
  overflow: "auto",
  padding: 24,
  boxSizing: "border-box",
  color: "var(--text-primary,inherit)",
  fontFamily: "inherit"
};
var control = {
  background: "var(--bg-elevated,#27292d)",
  color: "inherit",
  border: "1px solid var(--border-default,#555)",
  borderRadius: 7,
  padding: "8px 12px",
  font: "inherit"
};
function Frame({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("main", { style: box, children: [
    /* @__PURE__ */ jsx("h2", { style: { marginTop: 0 }, children: title }),
    children
  ] });
}
function usePage(title, resourceId) {
  const nav = useZccNavigate();
  useEffect(() => {
    nav.setPageContext?.({
      title,
      resourceId,
      view: resourceId ? "detail" : "list"
    });
    return () => nav.setPageContext?.(null);
  }, [nav.setPageContext, title, resourceId]);
}
function useData(method, args) {
  const rpc = useRpc();
  const key = JSON.stringify(args);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [revision, refresh] = useState(0);
  useEffect(() => {
    let alive = true;
    setPending(true);
    setData(null);
    setError("");
    void rpc.call(method, JSON.parse(key)).then(
      (value) => {
        if (alive) setData(value);
      },
      (cause) => {
        if (alive)
          setError(String(cause instanceof Error ? cause.message : cause));
      }
    ).finally(() => {
      if (alive) setPending(false);
    });
    return () => {
      alive = false;
    };
  }, [rpc, method, key, revision]);
  const reload = useCallback(() => refresh((x) => x + 1), []);
  return { data, error, pending, reload };
}
function Notice({
  pending,
  error
}) {
  return /* @__PURE__ */ jsxs(Fragment2, { children: [
    pending && /* @__PURE__ */ jsx("p", { role: "status", children: "Loading\u2026" }),
    error && /* @__PURE__ */ jsx("p", { role: "alert", children: error })
  ] });
}

// app.tsx
function TraceView({ threadId }) {
  const { data, error, pending, reload } = useData("trace", {
    threadId
  });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  usePage("Agent Traces", threadId);
  const step = data?.steps.find((s) => s.id === selected);
  const visible = data?.steps.filter(
    (s) => (s.name + " " + s.kind).toLowerCase().includes(query.toLowerCase())
  );
  return /* @__PURE__ */ jsxs(Fragment2, { children: [
    /* @__PURE__ */ jsx("p", { children: data?.thread.title }),
    /* @__PURE__ */ jsx("button", { style: control, onClick: reload, children: "Refresh trace" }),
    /* @__PURE__ */ jsx(Notice, { pending, error }),
    data && /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsxs("p", { children: [
        data.eventCount,
        " recorded events \xB7 ",
        data.steps.length,
        " steps"
      ] }),
      /* @__PURE__ */ jsx("p", { children: data.axis === "sequence" ? "Event order \xB7 timestamps unavailable in this host SDK" : "Available durations shown per step" }),
      data.truncated && /* @__PURE__ */ jsx("p", { role: "status", children: "Partial history: this view is bounded to 500 recent events and 200 steps." }),
      /* @__PURE__ */ jsx(
        "input",
        {
          "aria-label": "Filter steps",
          style: control,
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: "Filter tools and commands"
        }
      ),
      /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginTop: 16
          },
          children: [
            /* @__PURE__ */ jsxs("section", { style: { flex: "1 1 240px", minWidth: 0 }, children: [
              visible?.length === 0 && /* @__PURE__ */ jsx("p", { children: "No matching recorded steps." }),
              visible?.map((s) => /* @__PURE__ */ jsxs(
                "button",
                {
                  style: {
                    ...control,
                    display: "block",
                    textAlign: "left",
                    width: "100%",
                    marginBottom: 8,
                    overflowWrap: "anywhere",
                    background: s.id === selected ? "var(--bg-selected,#454062)" : control.background
                  },
                  onClick: () => setSelected(s.id),
                  children: [
                    /* @__PURE__ */ jsx("strong", { children: s.name }),
                    /* @__PURE__ */ jsx("br", {}),
                    /* @__PURE__ */ jsxs("small", { children: [
                      s.status,
                      " \xB7 #",
                      s.startSeq,
                      s.durationMs !== null ? ` \xB7 ${s.durationMs} ms` : ""
                    ] })
                  ]
                },
                s.id
              ))
            ] }),
            /* @__PURE__ */ jsx("aside", { style: { flex: "1 1 240px", minWidth: 0 }, children: step ? /* @__PURE__ */ jsxs(Fragment2, { children: [
              /* @__PURE__ */ jsx("h3", { children: step.name }),
              /* @__PURE__ */ jsxs("p", { children: [
                step.status,
                " \xB7 parent ",
                step.parentId ?? "current turn"
              ] }),
              /* @__PURE__ */ jsx(
                "pre",
                {
                  style: {
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    fontSize: 12
                  },
                  children: step.detail
                }
              )
            ] }) : /* @__PURE__ */ jsx("p", { children: "Select a step to inspect its available output." }) })
          ]
        }
      )
    ] })
  ] });
}
function Panel({ threadId }) {
  const { data, error, pending } = useData("threads", {});
  const [chosen, setChosen] = useState("");
  const id = threadId || chosen;
  usePage("Agent Traces", id || void 0);
  return /* @__PURE__ */ jsxs(Frame, { title: "Agent Traces", children: [
    !threadId && /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "Thread",
        " ",
        /* @__PURE__ */ jsxs(
          "select",
          {
            "aria-label": "Thread",
            style: control,
            value: chosen,
            onChange: (e) => setChosen(e.target.value),
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Choose a thread" }),
              data?.map((t) => /* @__PURE__ */ jsx("option", { value: t.id, children: t.title }, t.id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(Notice, { pending, error }),
      data?.length === 0 && /* @__PURE__ */ jsx("p", { children: "No threads yet." })
    ] }),
    id ? /* @__PURE__ */ jsx(TraceView, { threadId: id }, id) : /* @__PURE__ */ jsx("p", { children: "Choose a thread to inspect its recorded steps." })
  ] });
}
var app_default = definePluginApp((app) => {
  app.slots.navPanel({
    id: "main",
    title: "Agent Traces",
    icon: "Activity",
    placement: "extensions",
    component: Panel
  });
  app.slots.threadPanelAction({
    id: "trace",
    title: "Agent Traces",
    icon: "Activity",
    component: (p) => /* @__PURE__ */ jsx(Panel, { threadId: p.threadId })
  });
});
export {
  Panel,
  TraceView,
  app_default as default
};
