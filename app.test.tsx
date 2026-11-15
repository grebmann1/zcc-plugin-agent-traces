import { afterEach, beforeEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Panel, TraceView } from "./app.tsx";
import { rpc, slots } from "./test-runtime.js";
afterEach(cleanup);
beforeEach(() => {
  rpc.call.mockReset();
});
const data = {
  thread: { title: "Investigate" },
  eventCount: 12,
  truncated: true,
  axis: "sequence",
  steps: [
    {
      id: "x",
      name: "Read",
      kind: "tool",
      status: "completed",
      startSeq: 2,
      parentId: null,
      durationMs: null,
      detail: "Output text",
    },
    {
      id: "y",
      name: "Test",
      kind: "command",
      status: "running",
      startSeq: 3,
      parentId: "x",
      durationMs: 20,
      detail: "Tests passing",
    },
  ],
};
it("registers optional main and thread panels", () => {
  expect(slots.navPanel).toHaveBeenCalled();
  const action = slots.threadPanelAction.mock.calls[0][0];
  expect(action.component({ threadId: "x" })).toBeTruthy();
});
it("selects a thread, inspects a step, filters results and refreshes", async () => {
  rpc.call.mockImplementation(async (method) =>
    method === "threads" ? [{ id: "t", title: "Work" }] : data,
  );
  render(<Panel />);
  await screen.findByText("Work");
  fireEvent.change(screen.getByLabelText("Thread"), { target: { value: "t" } });
  await screen.findByText(
    "Partial history: this view is bounded to 500 recent events and 200 steps.",
  );
  fireEvent.click(screen.getByText("Read"));
  await screen.findByText("Output text");
  fireEvent.click(screen.getByText("Test"));
  await screen.findByText("Tests passing");
  fireEvent.change(screen.getByLabelText("Filter steps"), {
    target: { value: "missing" },
  });
  await screen.findByText("No matching recorded steps.");
  fireEvent.click(screen.getByText("Refresh trace"));
  expect(rpc.call).toHaveBeenCalledWith("trace", { threadId: "t" });
});
it("renders duration coverage and an empty thread catalogue", async () => {
  rpc.call.mockResolvedValue({ ...data, axis: "duration", truncated: false });
  const v = render(<TraceView threadId="t" />);
  await screen.findByText("Available durations shown per step");
  v.unmount();
  rpc.call.mockResolvedValue([]);
  render(<Panel />);
  await screen.findByText("No threads yet.");
});
it("uses the owning thread directly and displays failures", async () => {
  rpc.call.mockImplementation(async (method) => {
    if (method === "trace") throw new Error("Thread unavailable");
    return [];
  });
  render(<Panel threadId="t" />);
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Thread unavailable",
  );
  expect(screen.queryByLabelText("Thread")).toBeNull();
});
