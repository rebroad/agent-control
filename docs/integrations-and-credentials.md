# Integrations, credentials, and external channels

This document separates what Agent Control contains from services that must be installed and authenticated separately.

## Short answer

Agent Control 3.0.1 is a control plane, not an LLM distribution or a universal agent launcher.

| Facility | Included here? | What this repository does |
| --- | --- | --- |
| Agent Control TUI, lanes, queue, batons and policy | Yes | Persists work and enforces scheduling, ownership, approvals and recovery rules. |
| `chatgpt-window` | No | The name appears only in historical/boundary documentation. There is no built-in bridge, adapter, port, or credential flow for it in v3.0.1. |
| Generic Responses provider | Partly | Reads a configured HTTP endpoint for health and sends a deterministic qualification request. |
| Codex | No model runner | `harness.codex` is a capability label. The repository does not invoke `codex`, import its login, or store its credentials. |
| OpenAI ChatKit context reader | Narrow adapter | Optionally performs approved, read-only `GET` requests for an existing ChatKit thread. It is not the main LLM execution path. |
| Orca | Interface only | Provides a narrow TypeScript boundary and tests. The Orca runtime/adapter is external and is not installed or wired by this repository. |
| Android/Termux node | Yes, optional | Includes the node server, capability advertisement, read-only log job, recovery logic, and provisioning workflow. |

## What “infrastructure-neutral” means

The release is neutral about resource names, hosts, ports, providers, transports and hardware. These are configuration data under `resources`, `providers`, `services` and `lanes` in [config/agent-control.example.json](../config/agent-control.example.json). Empty collections are valid, and a no-configuration installation starts as `UNCONFIGURED` without scanning or changing external systems.

It does not mean that every provider or model is bundled. The current TUI registers configured providers and probes them, but the interactive input path does not itself launch an arbitrary LLM. A user must provide a compatible external execution/provider integration, and Orca is one optional boundary rather than a shipped dependency.

## What to connect, in practice

There are three separate things that can be connected; none is inferred from
an empty configuration:

1. A model/provider service: configure a `providers` entry whose `baseUrl` is
   an already-running service. Agent Control probes `<baseUrl>/health` and can
   send its fixed qualification request to `<baseUrl>/responses`.
2. An execution resource: configure a `resources` entry for a local, SSH, HTTP,
   or Orca-backed execution boundary. The resource advertises capabilities;
   it is not automatically a model.
3. A managed service: configure a `services` entry with an explicit health URL
   and, only if desired, an explicit `systemd-user` or command start recipe.

The current TUI can inspect these configured objects and run provider/Android
qualification actions. It does not provide a general prompt-submit loop that
maps a lane goal to a provider request. Consequently, a user who wants a
working LLM agent must supply the external adapter or worker that consumes the
lane/work-queue state and invokes the chosen model.

## ChatGPT Window

The previous author-specific `chatgpt-window` browser bridge is not part of this v3.0.1 tree. A repository search finds no runtime provider with that ID, no adapter server, and no listener implementation. The generic replacement is a configured provider such as:

```json
{
  "id": "my-responses-provider",
  "kind": "responses",
  "wireApi": "responses",
  "baseUrl": "http://127.0.0.1:19091/v1",
  "qualificationModel": "my-model",
  "requiresAuth": true,
  "capabilities": ["text", "reasoning"]
}
```

The endpoint must be supplied by another process. Agent Control calls its `/health` endpoint and, for the `Y` proof or qualification, posts to `/responses`. The current provider client does not add an `Authorization` header and does not read a provider credential variable. Therefore:

- an unauthenticated local adapter can work directly;
- an authenticated service must be fronted by an adapter that handles authentication, or the repository needs a future credential-aware provider implementation;
- setting `requiresAuth: true` currently documents intent but does not implement authentication.

The practical unauthenticated test is: start the external service, set its
`baseUrl` and `qualificationModel`, run `npm start`, press `G`, and then press
`Y`. A successful result proves only the configured Responses wire contract;
it is not evidence that lane prompts are being executed.

## Codex and OpenAI API credentials

The repository treats Codex as an external harness. Seeing `harness.codex` in a capability advertisement means only that a resource reported a `codex` executable; it does not log in, select a Codex model, send prompts, or manage Codex sessions.

Authenticate Codex outside Agent Control using the Codex CLI’s own supported flow, for example `codex --login`, or configure the CLI’s documented API-key method. The resulting local credential store belongs to Codex, not `.agent-control`; Agent Control never reads or copies it. Consult the [official Codex CLI authentication guidance](https://help.openai.com/en/articles/11381614-api-codex-cli-and-sign-in-with-chatgpt) for the current account flow.

For a normal OpenAI API application, the official convention is an `OPENAI_API_KEY` environment variable and bearer authentication. This repository does not use that variable for generic Responses providers. It uses it only in the separate OpenAI ChatKit qualification command described below. See the [official OpenAI API quickstart](https://platform.openai.com/docs/quickstart/make-your-first-api-request) and [API authentication guidance](https://platform.openai.com/docs/api-reference/authentication).

## OpenAI ChatKit context qualification

This is a bounded context reader, not a general model connector:

```bash
OPENAI_API_KEY='...' \
AGENT_CONTROL_ALLOW_AUTHENTICATED_CONTEXT_READ=true \
npm run qualify:openai-chatkit
```

The command reads the key from the process environment, requires the explicit approval flag, discovers or uses one `cthr_...` thread ID, performs only approved `GET` requests, validates identity, paginates bounded results, redacts sensitive text, and reports a qualification verdict. It does not create a thread, send a prompt, mutate a thread, create a share, or change Agent Control scheduling.

An optional `--output=...` result is written with mode `0600`; the key is not written to the result. `.env.local` is ignored by Git, but environment files still require normal local permission hygiene. ChatGPT shared URLs, ChatGPT Work threads and Codex task context are reference/read boundaries here, not automatic execution context.

## Orca

Orca is the name of an external execution substrate, not an LLM and not an OpenAI product. In this repository, `OrcaExecutionProvider` adapts an injected `OrcaRuntimePort` to Agent Control’s common execution contract.

The contract covers starting and identifying an execution, status, reconnect, input, pause/resume, cancel, output, diff and cleanup. Agent Control persists task/session identity, lease generation and ownership generation. On reconnect it requires the external adapter to prove continuity; an unproven or stale identity becomes `UNKNOWN` and input is rejected. Human takeover is persisted and fenced into the adapter.

There is no Orca binary, package, service unit, network endpoint, credential name or startup command in this repository. Installing or authenticating Orca requires a separate adapter project. Without that adapter, the built-in execution path remains the fallback and Orca-related tests are contract tests using a fake runtime.

## Batons, handoff, and destination context

A baton is persisted lane state, not a portable conversation transcript. The
initial baton is created for every configured/default lane and is updated when
the TUI accepts a goal or records a checkpoint. It lives in
`.agent-control/lanes/lane-NNN/baton.json` and contains compact status,
progress, evidence, changes, next action, open questions, model/reasoning
labels, and optional context-source IDs.

The `ControlPlane` library implements `handoff` and `clone`; the current TUI
does not expose either operation as a key or command. Handoff copies the goal,
constraints, shared-task IDs, and baton to the destination lane, increments the
revision, pauses the source, and transfers the lease. Clone copies the lane
contract and baton while leaving the source active. Neither operation invokes
an LLM to summarize the work, negotiates with the destination model, or changes
the destination model's context window.

`ContextRouter` is a separate reusable service. If an integration supplies the
task evidence, current commit, model capacity, reserved prompt tokens, context
limit, token price, cost limit, and latency limit, it can choose a bounded set
of referenced sources and record what was selected or omitted. That selection
is not automatically attached to a TUI handoff, and the router does not call a
model or guarantee that a destination model understands the baton.

Therefore the honest current workflow is: an external orchestrator or future
TUI integration must read the baton, choose a compatible worker, call the
context router if needed, format a destination prompt, and record the result
back into Agent Control.

### Exactly how a baton is created

At startup, `src/index.ts` chooses the configured `lanes` array, or creates one
default `Primary` lane when that array is empty. For each lane, the `lane()`
constructor creates both the contract and baton from configuration plus fixed
initial values:

| Baton data | Source at creation | Initial meaning |
| --- | --- | --- |
| `version` | constructor | Baton schema version `1`. |
| `laneId` | lane configuration ID | Stable lane identity. |
| `revision` | constructor | `1`; incremented on baton updates/copies. |
| `status` | constructor | `Await task`. |
| `progress`, `evidence`, `changes`, `openQuestions` | constructor | Empty arrays. |
| `hypothesis` | constructor | Empty string. |
| `nextAction` | constructor | `Await command`. |
| `model`, `reasoning` | constructor | `unassigned`, `medium`; labels only. |
| `contextSourceIds` | later, optional | References attached by an integration; absent initially. |
| `updatedAt` | current clock | Creation/update timestamp. |

The lane configuration supplies the lane ID, name, working directory, priority,
and mode. The remaining contract fields—initial goal, constraints,
capability requirements, resource/model locks, and shared-task IDs—are fixed
defaults until an operator or integration changes them. None is inferred from
an LLM. The initial workspace is written to `.agent-control/workspace.json` and
each lane is also written as
`.agent-control/lanes/lane-NNN/{contract,baton,lease}.json`.

When an operator submits text in the current TUI, the selected lane's
`contract.goal` is replaced with that text, its status becomes `waiting`, and
`touchBaton()` changes the baton status to `Task accepted; capability
resolution pending`, sets the next action to `Resolve capabilities and acquire
resource leases`, increments `revision`, updates `updatedAt`, and appends a
`baton.updated` event. Checkpoints persist the complete workspace; they do not
ask a model to summarize it.

When the library's `ControlPlane.handoff()` is called, it explicitly copies the
source goal, constraints, shared-task IDs, and baton fields to the destination,
changes the destination lane ID, increments the revision, marks it `Received
from lane N`, pauses the source, and transfers the lease. `clone()` performs a
similar copy while keeping the source active. Neither path receives new data
from an LLM, computes a summary, or adapts the baton to a destination context
window. The current TUI does not call either method.

### Baton versus Codex conversation compaction

These solve different problems:

| | Agent Control baton | Codex/OpenAI compaction |
| --- | --- | --- |
| Primary purpose | Durable coordination, ownership, recovery, and handoff metadata. | Continue one long model conversation after context pressure. |
| Creator | Agent Control code and explicit integration calls. | The model/API conversation mechanism. |
| Contents | Small, named, inspectable fields and references; no transcript or reasoning trace. | Loss-aware compression of prior conversation state; official API output is opaque/encrypted. |
| Context-window awareness | None during baton creation or current handoff. `ContextRouter` can budget referenced sources only when explicitly invoked with destination capacity. | Compaction is specifically intended to reduce context footprint for continuation. |
| Provider portability | High: fields do not depend on Codex or OpenAI. | Provider/model-specific; the official `/responses/compact` flow is an OpenAI Responses feature. |
| Best use | Tell another worker what the task is, what is authoritative, what remains, and who owns it. | Preserve conversational continuity for the same model workflow. |
| Main weakness | Too sparse to replace a conversation summary; an external adapter must format it for a model. | Not a durable cross-worker coordination contract and not designed for human inspection or independent provenance. |

OpenAI’s official guidance describes compaction as a loss-aware continuation
operation that returns opaque items, recommends compacting after milestones, and
says not to parse or depend on those items. See [Compaction in the official
model guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.2)
and the [Compact a response API reference](https://developers.openai.com/api/reference/java/resources/responses/methods/compact).

Those are OpenAI Responses API references, not evidence that this repository or
the Codex CLI invokes `/responses/compact`: a repository search finds no such
call. Any Codex-side automatic compaction remains inside Codex; Agent Control
only sees it if an external Codex adapter reports a result.

The practical evaluation is therefore: a baton is useful alongside compaction,
not instead of it. It gives a scheduler and a human a stable, provider-neutral
coordination record; compaction gives one model a richer continuation of its
conversation. In the current repository there is no bridge that combines the
two, so a destination-worker adapter would need to read the baton, select or
compact the relevant evidence, construct the destination prompt, and write
back updated baton/evidence fields.

## Load sharing and Codex sub-agents

The reusable `WorkScheduler` and `WorkCoordinator` can allocate explicit work
items across healthy resources. Their scoring considers required capabilities,
health, load/capacity, data locality, cost, latency, priority, dependencies,
quiet periods, budgets, and batch compatibility. Interactive/priority work can
checkpoint preemptible background or batch work.

This is not currently an end-to-end LLM load balancer. The TUI does not submit
ordinary lane prompts to that scheduler, provider `parallelism` is not enforced
as a worker pool, and the `D` demo queue is synthetic. Agent Control also does
not modify Codex, inject alternative models into Codex, or rewrite Codex
sub-agents. Non-OpenAI workers require a separately operated provider, CLI
harness, or execution adapter that exposes the capabilities Agent Control is
configured to use.

## Android provisioning: exactly what it does

Android provisioning is optional and is not required for a local first run. It is a durable queue of explicit operations, not a generic Android takeover mechanism:

1. Detect whether the controller has `adb`.
2. If it is absent, pause for approval to run the fixed root-owned helper that installs only the `adb` package. No sudo password is read or stored.
3. Pause for a human to approve Android Wireless Debugging pairing.
4. Confirm a freshly observed, paired `adb` transport.
5. Download the latest Termux:Boot APK metadata and artifact from the official `termux/termux-boot` GitHub release.
6. Hash and re-check the downloaded artifact.
7. Install the APK through `adb` and verify that the expected package is present.
8. Run the repository’s scoped boot-hook installer through Termux `run-as`.
9. Compare the installed boot hook’s hash with the repository source and verify it is executable.
10. Stop at a durable reboot-approval gate; rebooting is never implicit.
11. If explicitly approved, reboot through `adb` and wait for the configured keyed SSH transport to return. A failed or missing transport remains resumable and does not grant capability.

The Android node binds to loopback by default, exposes `/health`, authenticated `/v2/resource`, and one authenticated `POST /v2/jobs` operation: `android.observe.logs`. Unsupported jobs are rejected. It does not expose arbitrary shell execution, create credentials, or publish the node publicly.

The Android node credential is named by the configured resource’s `android.credentialEnv`. The controller reads that environment variable only when probing/recovering the configured node and sends it as a bearer token. If `android/install-boot.sh` receives an already-created token, it stores it on the Android device at `~/.config/agent-control/android-node-token` with mode `0600` for optional boot recovery. The repository never generates the token.

## Other channels and side effects

This repository can communicate beyond LLM endpoints. The possible channels are explicit and configuration- or command-driven:

- local filesystem: `.agent-control/` state, queue, workspace, events, context metadata and qualification JSON;
- local subprocesses: configured service start commands, `adb`, `ssh`, `curl`, `systemd-user`, Git helpers and optional CLI agents;
- HTTP/HTTPS: configured service/provider/resource health URLs, Responses endpoints, Android node endpoints, GitHub release download during Android provisioning, and OpenAI ChatKit qualification;
- SSH: configured remote resources and Android recovery, using a configured identity file or external SSH agent; passwords are not accepted by the Android recovery path;
- ADB: Android pairing, package installation, boot/reboot qualification and the scoped log observation job;
- terminal PTYs: local discovery and ownership/fencing; the repository does not claim a production shell multiplexer.

There are no Telegram, WhatsApp, Slack, Discord or social-media channel integrations in the v3.0.1 source tree. A provider or configured command could itself communicate elsewhere, but that would be outside Agent Control’s declared integration boundary.

## Credential storage rule

Keep secrets outside `config.json`, source, Git, evidence and ordinary backups. Use environment variables, the external tool’s own credential store, an OS secret manager, or a protected qualification environment file. The config validator rejects secret-like fields and URLs containing embedded usernames/passwords. `scripts/qualify-remote.sh` accepts no secrets on its command line and requires its optional environment file to be mode `0600` or `0400`.
