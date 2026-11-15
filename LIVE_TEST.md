# Built-Electron integration check

The cross-plugin runner expects sibling checkouts named `agent-traces`, `office-viewer` and `burn`, and a current Zana source checkout with the project-file and thread-list SDK APIs.

```sh
ZANA_REPO_ROOT=/path/to/zana-command-center node integration/run-live.mjs
```

The default command uses Zana's private runtime preparation and disposable HOME fixtures. It runs the three-plugin check plus the packaged-provider startup and plugin-authoring suites. `--ports-only` selects the plugin check alone. `--existing-build` snapshots an existing production build; it must meet the plugins' Zana >=2.6.1 requirement.

The test installs each plugin using the shipped CLI and checks its running state. It persists normalized tool, command and cumulative-token fixtures in the disposable profile, then exercises the real SDK/RPC/renderer path: trace steps, command output and filtering; Burn cost calculation, warnings and rate persistence; DOCX, XLSX and PPTX previews and quoting; denied access outside the project; and a visible source edit through `zcc plugin dev --once` in the already-open panel. `zcc plugin reload` loads existing artifacts; source edits require a build first.

On 2026-11-15, the cross-plugin flow passed against an isolated built Zana 2.6.1 source build. All four packaged-provider startup tests and the plugin-authoring live test also passed. The host checkout included ongoing development changes; this is source-build verification, not a claim about every distributed 2.6.1 build. Unit/model/server/UI tests and CI remain separate checks. No test installed plugins into the active user profile.
