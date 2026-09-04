# Quick setup

This is the shortest path from a fresh checkout to a safe local Agent Control
session. It does not require Android, Orca, Codex, ChatGPT, or a model server.

## 1. Install the prerequisites

Install Node.js 20 or newer, npm, Git, and Bash. From the repository root:

```bash
npm install
mkdir -p .agent-control
```

For a clean first run, create an empty configuration:

```json
{
  "schemaVersion": 1,
  "resources": [],
  "providers": [],
  "services": [],
  "lanes": []
}
```

Save that as `.agent-control/config.json`. The repository also includes
[`config/agent-control.example.json`](config/agent-control.example.json), but
it contains illustrative remote, Android, service, and provider entries. Use
it only after replacing its example hosts, paths, commands, and model endpoint
with values that exist on your machine. Do not put passwords, API keys, or
tokens in the JSON file.

## 2. Check the checkout

```bash
npm run check
```

This runs TypeScript validation, bootstrap-script checks, the infrastructure
neutrality guard, and the test suite. If it passes, the checkout itself is
ready.

## 3. Inspect the local state

```bash
npm run status
```

With no valid external configuration, the result is `UNCONFIGURED`. That is a
safe state: Agent Control does not scan ports, invent providers, start
services, or contact an Android device.

The empty file has a purpose: it creates the operator-owned configuration and
state boundary, and proves that the control plane can start without silently
connecting to somebody else's infrastructure. It does not discover or create
LLM integrations. Every meaningful resource and endpoint must be added by the
operator.

## 4. Start the operator interface

```bash
npm start
```

The TUI is the operator-facing control plane. `npm run up` is the health-first
variant that also starts only explicitly configured service recipes. Use
`npm run down` to stop processes that Agent Control recorded as its own.

## 5. Add an LLM only when you have one

Agent Control does not download, log into, or launch an LLM. To connect one,
first run a compatible external service that provides:

- `GET <baseUrl>/health`, returning a successful response; and
- `POST <baseUrl>/responses`, accepting `{ "model": "...", "input": "...", "stream": false }`.

Then add a provider entry such as this to `.agent-control/config.json`:

```json
{
  "id": "my-model-service",
  "name": "My model service",
  "kind": "responses",
  "wireApi": "responses",
  "baseUrl": "http://127.0.0.1:19090/v1",
  "qualificationModel": "my-model",
  "requiresAuth": false,
  "capabilities": ["text", "reasoning"]
}
```

The surrounding config must retain the top-level `schemaVersion`, `resources`,
`services`, and `lanes` fields. Run `npm start`, press `G` to probe providers,
then `Y` to run the deterministic Responses proof. A passing proof validates
the endpoint; it does not turn the TUI into a chat client or submit arbitrary
lane prompts. The generic client currently does not inject authorization
headers, so an authenticated provider needs an external local adapter.

Codex credentials remain managed by the Codex CLI. `harness.codex` only
advertises that a configured resource has a Codex executable; it does not log
in or invoke Codex automatically. Orca and `chatgpt-window` are not bundled.
Agent Control does not modify Codex or replace its sub-agents. A non-OpenAI
worker is possible only as an external provider or execution adapter that you
configure and operate separately; there is no automatic Codex sub-agent
rewriting or model federation here.

## What the lanes and batons actually do

A lane is a durable work slot and policy record, not an LLM session. Typing a
goal into the TUI changes the selected lane's goal and baton, writes state
under `.agent-control/`, and marks the lane waiting for capability resolution.
It does not call a model.

The baton is a compact JSON record containing status, progress, evidence,
changes, next action, questions, model label, reasoning label, and optional
context-source references. It is initialized when the lane is created and is
stored at `.agent-control/lanes/lane-NNN/baton.json`.

The source library has `handoff` and `clone` operations, but the current TUI
has no command that invokes them. A handoff copies the goal, constraints,
shared-task IDs, and baton to another lane, increments its revision, pauses the
source, and acquires a lease for the destination. It does not ask either LLM
for a summary, measure a destination model's context window, or transform the
prompt. The context router can select referenced evidence within supplied
token/cost/latency limits when an integration calls it, but it is not wired
automatically into TUI handoff.

For the exact input fields and a comparison with Codex conversation compaction,
see the field-by-field explanation in
[`docs/integrations-and-credentials.md`](docs/integrations-and-credentials.md).

## Load sharing and workers

The reusable `WorkScheduler`/`WorkCoordinator` library can choose among healthy
resources by required capabilities, current load, capacity, data locality,
cost, latency, priority, dependencies, and batch class. Interactive work can
checkpoint preemptible background work. However, the current TUI does not
submit ordinary LLM conversations to that scheduler, and provider
`parallelism` is configuration metadata rather than an enforced pool. The
`D` demo key exercises queue mechanics only; it is not a live multi-model
workload.

## 6. Optional Android setup

Android is not needed for first use. If you deliberately configure an Android
resource, read [`android/README.md`](android/README.md) and the exact operation
sequence in [`docs/integrations-and-credentials.md`](docs/integrations-and-credentials.md)
before running:

```bash
npm run provision:android
```

Provisioning installs and verifies ADB/Termux:Boot transport prerequisites and
the read-only node boot hook. It does not install an LLM, create a token, or
authenticate Codex/OpenAI. Every privileged, pairing, and reboot action has an
explicit approval gate.

## Where to read next

- [`README.md`](README.md): capabilities and normal commands.
- [`docs/concepts.md`](docs/concepts.md): plain-language definitions of lanes, batons, leases, resources, providers, and workers.
- [`docs/architecture-v2.md`](docs/architecture-v2.md): authority and recovery model.
- [`docs/Agent-Control-3.0.1-Operator-Guide.md`](docs/Agent-Control-3.0.1-Operator-Guide.md): full operator guide.
- [`docs/integrations-and-credentials.md`](docs/integrations-and-credentials.md): external services, credentials, and channels.
