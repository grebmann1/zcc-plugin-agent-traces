# Agent Traces for Zana

Optional Zana Command Center plugin, version 0.1.0. This is a focused first release inspired by [Agent Traces for BB](https://github.com/charpeni/bb-plugins/tree/89d326e355648f9ca9cab969f6ae25a66d8c790c/plugins/agent-traces), not full upstream feature parity. The researched original source is preserved on the [`upstream/bb`](https://github.com/grebmann1/zcc-plugin-agent-traces/tree/upstream/bb/source) branch.

Inspect tool and command steps from a selected thread, filter them, and read bounded output. The same view is available as a thread side panel.

## Install

Requires a current Zana 2.6.1 build with the thread-list and project-file SDK APIs. In **Plugins → Install**, paste:

```text
https://github.com/grebmann1/zcc-plugin-agent-traces.git
```

Or run:

```sh
zcc plugin install 'git:https://github.com/grebmann1/zcc-plugin-agent-traces.git@v0.1.0'
```

The repository includes compiled `app.js` and `server.mjs` entries and editable TypeScript sources. No global tools or paid analysis model are required. Plugins execute with full server trust after installation. This plugin sends no telemetry or document/trace content to an external service.

## Use

Open **Plugins → Pages → Agent Traces** or the thread’s **Agent Traces** side-panel action. Use the refresh control to reload recorded data. Installation is optional; this repository does not change Zana core.

## Limits

The current Zana SDK exposes event sequence but omits timestamps. This release shows event order; duration is displayed only if a host supplies real timestamps. The view reads at most 500 recent events and shows 200 steps, with a visible partial-history notice. It does not reconstruct child-thread histories, approval waits or export OTLP/HTML.

## Develop and verify

```sh
npm ci
npm run check
```

`check` runs TypeScript, meaningful parser/model/server/UI tests with an enforced 80% minimum for statements, branches, functions and lines, and rebuilds the committed artifacts. Build scripts use Zana’s shared React/SDK runtime instead of shipping another React instance. CI repeats these checks and rejects stale compiled artifacts. SDK ambient types are vendored; the small `types/current-host.d.ts` and `host.ts` additions reflect APIs in the current source host that the CLI facade has not yet incorporated.

Use an isolated built-Electron profile for installation, file access and reload checks; see `LIVE_TEST.md`. The Agent Traces repository contains the cross-plugin integration runner and expects sibling `agent-traces`, `office-viewer` and `burn` checkouts. No test changes your active Zana profile.

## Attribution

Upstream: [https://github.com/charpeni/bb-plugins](https://github.com/charpeni/bb-plugins/tree/89d326e355648f9ca9cab969f6ae25a66d8c790c/plugins/agent-traces), researched revision `89d326e355648f9ca9cab969f6ae25a66d8c790c`. See `UPSTREAM.md`, `upstream-source.json` and `LICENSE.upstream`. Zana adaptation: MIT, Guillaume Rebmann. This repository is independently maintained and is not an official BB or Zana release.
