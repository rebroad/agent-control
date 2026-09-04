# Agent Control 3.8.2 release candidate

Agent Control runs governed parameterised jobs against qualified execution and model resources. It is an infrastructure-neutral, policy-controlled adaptive harness for durable work by heterogeneous agents and models. Its executable harness core composes a task-appropriate worker, provider/model route, prompt profile, minimum qualified skills, restricted tools, context strategy, runtime settings, authority snapshot, resource limits and verification/escalation policy into a fingerprinted execution recipe.

3.8.1 separates workload/repository location, provider execution location, and credential residency. The recommended default keeps credentials on the Agent Control controller or a designated credential/provider-execution node; managed workload nodes need not store provider credentials. Agent Control transfers frozen work/context, never credential stores. Remote credential residency remains supported where policy requires it. See [credential residency](docs/credential-residency.md), [Codex integration](docs/models/CODEX-INTEGRATION.md), and the [3.8.1 migration guide](docs/migration-3.8.1.md).

The post-3.8.1 release candidate adds a human-readable **Execution history** to Saved Job Run detail and Lane Activity. It is a bounded, redacted projection of the existing durable Job Run, Work Parcel, token-governor and baton records—not a new transcript database or authority path. Entries identify operator requests, system transitions, provider activity, tool/action evidence, telemetry, governor recommendations, sealed batons, verification and errors. A baton is not labelled as a completed handoff unless the durable routing outcome says it succeeded. Raw prompts, rejected provider bodies, hidden reasoning and credential material remain excluded. See [execution history](docs/execution-history.md) and [dashboard operation](docs/web-dashboard.md).

This candidate also closes a repository-review schema mismatch found during the 3.8.1 video qualification. The provider-facing structured-output schema now carries the same semantic literals, enums and ranges as application validation, and rejection evidence records safe failing JSON paths without retaining raw output. Validation remains fail closed. See the [qualification report](docs/evidence/agent-control-3.8.2-human-readable-history-qualification.md).

## Governed retrieval and context intelligence

3.8 adds an opt-in provider-neutral path: `Work Parcel → Retrieval Intent → Retrieval Governor → Retrieval Provider → Evidence Packet → ContextGraph/ContextPacketBuilder → Model → Verification/Baton`. It starts with bounded local exact/BM25 evidence, can use optional semantic/hybrid adapters such as zg, reacts to the 3.7 token governor's context pressure, streams redacted retrieval lifecycle metrics over the existing SSE dashboard, and revalidates content-addressed evidence references after baton handoff or restart. Search authority never grants index mutation, remote retrieval is denied by default, stale evidence is explicit, and insufficient or failed retrieval retains the immutable frozen context.

```json
{"retrieval":{"enabled":true,"providers":["exact","lexical"],"maximumCalls":4,"maximumEvidenceTokens":8192,"allowRemote":false}}
```

zg is optional and normal startup has no new dependency. Built-in retrieval is deliberately constrained: only observable exact/path/query coverage can establish sufficiency; provider rank is not treated as calibrated confidence, and weak evidence escalates or falls back. A generic resource policy chooses provider use, built-in retrieval, authorized index build, or deferral from memory, storage, repository size, index state and expected task duration. See [architecture review](docs/agent-control-3.8-architecture-review.md), [configuration and operation](docs/governed-retrieval.md), [Phase 2 qualification](docs/evidence/agent-control-3.8-phase2-qualification.md), and [3.8 migration](docs/migration-3.8.md).

The frozen 12-task Qwen2.5 Coder 3B mutation comparison verified 2/12 outcomes in every lane. Built-in retrieval reduced processed tokens per verified outcome from 95,101 to 76,189 (19.9%); zg reduced it to 88,039.5 (7.4%). This qualifies non-regression and context efficiency for the governed mechanism, not a broader small-model capability claim. Retrieval remains disabled by default and never silently substitutes weak evidence.

A lane owns its task; recipes, agents, models, skills, tools, execution providers and operator interfaces are replaceable and remain below the control boundary. Agent Control remains authoritative for scheduling, priorities, leases, ownership, unconditional human takeover, batons, handoffs, clones, shared tasks, provider qualification, routing, approvals, recovery validation, verification and conflict policy. In 3.1.0, ordinary `WorkExecutor` agent work can no longer accept a raw handler: it builds and records an `ExecutionRecipe`, dispatches it through `AdaptiveHarness`, and exposes only a live-authority `ToolPolicy` gateway.

Orca is available behind a narrow execution-provider contract. Orca may execute processes, terminals and worktrees, but it does not receive Agent Control policy authority.

## Identity, sessions and delegation

3.5 adds a persistent identity control plane with an explicit chain:

`Actor → Session → Work Parcel → Agent → Model → Provider → Runtime → Node/Resource → Evidence`

The session creator is immutable. Participants, capabilities, context policy and mode (`observer`, `collaborative`, `operator-controlled`, or `restricted`) are durable. Agent-to-agent delegation records both actors, both agents, the context-transfer hash, inherited authority, requested/actual model, child Run and evidence. Child authority must be a subset of its parent and session. Secrets remain opaque references used through capability-checked operations; literal credentials are rejected from context and persistence.

The dashboard **Sessions** tab reads this authoritative store and shows participants, active attributed Work Parcels, the agent/delegation graph, baton token/hash traces, models, runtime/node identity, context policy, evidence and complete-chain token/cost values where providers reported them. Execution admission enforces the session's participant authority, model/node allow-lists and filesystem/network envelope. Existing records receive deterministic `legacy-actor:*` / `legacy-session:*` attribution; legacy “Ox” labels remain historical aliases of canonical `GLM-5.3-Flash`, not a distinct model.

The 3.6 runtime retained by 3.7 packages the governed ACP mapping as a real stable-v1 newline-delimited JSON-RPC stdio endpoint using the pinned official TypeScript SDK. It supports initialization, session new/load/resume/list/prompt/cancel/close, ordered plan/tool updates, request cancellation, durable session reconstruction and graceful shutdown. ACP is an interoperability edge, not a second scheduler, shell or tool-authority path.

The caller must be admitted as an existing Actor; stdio uses `AGENT_CONTROL_ACP_ACTOR_ID` and defaults to the already registered `web-operator`. Diagnostics go to stderr because stdout is reserved for protocol frames:

```bash
AGENT_CONTROL_STATE_DIR=/srv/agent-control/state \
AGENT_CONTROL_ACP_ACTOR_ID=web-operator \
agent-control acp
```

No remote listener is enabled by this command. ACP v2 remains draft, is not imported by the stable runtime and is not claimed. See [identity and delegation](docs/identity-sessions-delegation.md), [security](docs/security-3.5.md), [migration](docs/migration-3.5.md), and [ACP compatibility](docs/acp-compatibility.md).

Authenticated Streamable HTTP and WebSocket are separately and explicitly enabled. The token is resolved indirectly from the named environment variable; it is never accepted in a URL or configuration file. Loopback is the safe default, and a non-loopback bind fails unless a TLS certificate/key pair is configured:

```bash
export AGENT_CONTROL_ACP_REMOTE_ENABLED=true
export AGENT_CONTROL_ACP_REMOTE_TOKEN_ENV=ACP_OPERATOR_BEARER
export ACP_OPERATOR_BEARER='use-a-secret-manager-generated-value'
agent-control acp-remote
```

Optional settings are `AGENT_CONTROL_ACP_REMOTE_HOST`, `AGENT_CONTROL_ACP_REMOTE_PORT`, `AGENT_CONTROL_ACP_REMOTE_PATH`, `AGENT_CONTROL_ACP_REMOTE_ALLOWED_ORIGINS`, `AGENT_CONTROL_ACP_REMOTE_TLS_CERT_FILE`, and `AGENT_CONTROL_ACP_REMOTE_TLS_KEY_FILE`. Production exposure remains an operator deployment decision; development did not open or modify a live listener.

## Contract-owned process and PTY state

The 3.6 runtime retained by 3.7 persists the ownership chain `Lane → Contract → Baton → Process/PTY → Agent`. A contract retains task identity, completion criteria, authority, protected-resource rules, budget, sealed baton, attachments, pending actions, verification and evidence if an agent disconnects or a controller restarts. PTY consultation and reconnect are read-only; write control is singular and explicitly transferred. Human takeover pauses agent authority before accepting writes, and agent resumption requires deliberate return. See [contract and PTY runtime](docs/contract-pty-runtime.md).

Governed workers return exactly one explicit outcome: `SACRIFICE`, `SUBSTITUTE`, `DELEGATE`, `YIELD`, or `COMPLETE`. AUTO handoffs execute only inside the contract's existing authority, resource envelope and budget. Costly escalation, privilege/resource expansion, production writes, destructive actions and explicitly MANUAL requests wait for the contract operator. `COMPLETE` means “submit for independent verification,” not success. See [governed handoffs](docs/governed-handoffs.md).

Providers and models now have a session-neutral lifecycle separate from execution sessions: `DISCOVERED → BENCHMARKING → SHADOW → CANDIDATE → ACTIVE → PREFERRED → DEPRECATED`. Immutable recipes bind exact provider/model/version and capability requirements. Versioned champion/challenger policy supports historical replay and evidence-gated rollback while keeping credentials as indirect references. See [provider and model lifecycle](docs/provider-model-lifecycle.md) and [adding a provider](docs/models/ADDING-A-PROVIDER.md).

Capability routing now has a frozen 60-task suite with a 12-task holdout and a separately accounted twelve-child coordinator/baton experiment. The deterministic classifier scored 60/60 with zero unsafe false positives, but no physical provider observations have been supplied to the new gate. Automatic production routing therefore remains disabled; use only manual, benchmark, shadow, candidate or governed opt-in modes. See the [capability-routing benchmark](docs/capability-routing-benchmark.md).

The separate physical chain `gpt-5.6-luna → local Qwen2.5 3B → z-ai/glm-5.3-flash → gpt-5.6-luna` has now run with local `YIELD`, GLM `SUBSTITUTE`, minimal batons, controller reconstruction and independent parent/child verification. It qualified with observed GLM retries and unknown provider token/cost data; it does not satisfy the larger automatic-routing gate. See [physical multi-provider qualification](docs/physical-multi-provider-qualification.md).

The existing Sessions, Systems and Models dashboard views now read one redacted `GET /api/runtime` projection for stable ACP v1 transports/sessions, contract/process/PTY ownership, approvals, handoffs, baton hashes/sizes and immutable provider/model lifecycle state. Prompt bodies, objectives, baton payloads, transcripts, credential references and unavailable usage/cost are not exposed. See [dashboard usage](docs/web-dashboard.md), [3.6 security boundaries](docs/security-3.6.md), and the [development qualification evidence](docs/evidence/agent-control-3.6-development-qualification.md).

## Token-Aware Baton Routing

3.7 introduces durable live token/context telemetry and a policy-driven baton governor. Each running thread reports provider/account profile/model, cumulative input/output/total tokens, current context/window/percentage where exposed, authority (`authoritative`, `estimated`, or `unavailable`), cost, elapsed time, governor state, and next threshold. The dashboard receives updates through its existing SSE stream without a page refresh and retains Work Parcel totals through handoffs: `OpenAI/Lawrence Pro/Sol 184k → OpenAI/Cottage Plus/Luna 31k → GLM/default/GLM-5.3-Flash 18k = 233k total`.

Default policy records `CONTINUE` at 60%, `PREPARE_BATON` at 75%, `COMPACT` at 85%, and handoff evaluation at 90%. Context pressure is not a downgrade command: unfinished difficult reasoning stays on the stronger model. A handoff requires a sealed verified baton, bounded/mechanical remaining work, compatible qualified target, policy permission, and a lower-cost target where price information exists. Compaction, native context changes and resume boundaries are durable events and never reset Work Parcel totals. The normal parameterized repository-review lifecycle now evaluates this policy between immutable context chunks, delegates the next bounded chunk through the existing contract/handoff runtime, and returns the consolidated result to the existing independent validator. A failed destination is marked failed and the preserved source route resumes the same chunk. See [Token-Aware Baton Routing](docs/token-aware-baton-routing.md) and the [Codex 0.153 review](docs/evidence/agent-control-3.7-codex-0.153-review.md).

Codex routes may optionally bind an opaque account profile beneath the provider. The complete identity is `workload node + provider → account profile → model + provider-execution node + credential node`. Each profile points to a separately authenticated `CODEX_HOME` through an environment-variable reference resolved only on its credential node; Agent Control never reads, copies, logs, or persists OAuth files or resolved paths. Windows credential nodes use the configured governed SSH resource and fixed read-only PowerShell operations—there is no arbitrary remote-shell API. Authenticate each home once interactively on its own node, then use **Models → Check account** to qualify it independently. Saved Jobs may pin `accountProfile`, or leave it to predetermined model-role policy. Agent Control does not rotate accounts to evade or combine usage limits, and rate-limit/exhaustion failures remain attributed to the account that produced them. Configuration and login examples are in [Codex integration](docs/models/CODEX-INTEGRATION.md).

The production lifecycle is physically qualified across two distinct live local provider/model routes. A real source result triggered the unchanged governor under an economical qualification-only threshold policy, produced a sealed baton, continued on the destination and passed independent verification; 186 source plus 510 destination tokens reconciled to 696 parcel tokens. A second run refused the destination and recovered the original source thread. Provider-unreported context and cost remain explicitly estimated or unavailable. See the [physical qualification evidence](docs/evidence/agent-control-3.7-physical-qualification-20260902.md).

## Governed fast execution (Spark)

3.5 adds an optional `FAST_EXECUTION_MODEL` execution class, currently implemented by the exact model `gpt-5.3-codex-spark`. Its purpose is to avoid spending a more capable model on mechanically understandable, low-risk work while retaining Agent Control classification, authority, evidence and verification. It is disabled by default and is separate from the THIN context profile. The governed execution hierarchy is:

`LOCAL → SPARK → STANDARD → FRONTIER`

LOCAL, STANDARD and FRONTIER remain logical policy classes backed by the configured model registry; they are not hard-coded model names. THIN/STANDARD/DEEP describe harness and context size, whereas LOCAL/SPARK/STANDARD/FRONTIER describe model execution class. A task reaches Spark only when it is explicitly trivial, THIN, low-risk, deterministically verifiable, within one file/80 changed lines by default, outside protected paths, and free of security, authentication, migration, governance, release, deployment or production signals.

Agent Control selects Spark through the provider-neutral model-registry role `fast-execution`, sends a small sealed baton, disables Codex multi-agent fan-out, permits exactly one attempt in a disposable clean Git worktree, independently checks scope and verifier evidence, and escalates visibly to STANDARD on failure or ambiguity. There is no silent substitution: if Spark is unavailable or the exact qualified route cannot be resolved, no Spark invocation is claimed and existing governed routing remains authoritative. Persistent telemetry and the Sessions view identify the originating Work Parcel/Run/Session, actual model, selection reason, context size, verification and successor. Availability is established by an authenticated bounded `codex exec --model gpt-5.3-codex-spark` probe, not by assuming a subscription or API model.

Enable or disable the lane in `.agent-control/config.json` or **Configuration → Fast execution**. Enabling policy does not bypass exact model qualification or the availability probe:

```json
{
  "spark": {
    "enabled": false,
    "model": "gpt-5.3-codex-spark",
    "modelRole": "fast-execution",
    "maximumFiles": 1,
    "maximumChangedLines": 80,
    "maximumAttempts": 1,
    "maximumSubagents": 0,
    "maximumContextTokens": 2048,
    "verificationRequired": true
  }
}
```

Run the non-mutating classifier/availability qualification with `npm run benchmark:fast-execution`; run the frozen disposable live comparison explicitly with `npm run benchmark:fast-execution -- --live --standard-model gpt-5.6-luna`. The current requalification recorded 7/7 verified Spark outcomes versus 6/7 for the comparison route, median latency 14.464s versus 27.100s, and zero classifier false positives across ten cases. Provider cost was not reported and remains unknown; Spark used more output tokens. This single-host research-preview result is promising but not broad enough to enable the lane by default. See [the governed flow and routing architecture](ARCHITECTURE.md#fast-execution-class), [fast-execution operator usage](docs/fast-execution.md), [Codex integration](docs/models/CODEX-INTEGRATION.md), and the [qualification evidence](docs/evidence/agent-control-3.5-qualification.md).

## Parameterised Jobs quick start

3.4 separates reusable **Job Definitions** from configured **Saved Jobs**, persistent **Schedules**, and immutable **Runs**. The built-in `repository-code-review@1` resolves and freezes a Git revision, builds bounded deterministic context, routes `review.default` to a qualified provider/model, creates attributable Work Parcels, validates evidence-backed findings, records usage/cost, and advances a successful delta baseline. It invokes the provider directly: Codex, ChatGPT, a browser session, and conversation history are not prerequisites.

Configure a local execution resource, a qualified model for `review.default`, and repository policy in `.agent-control/config.json`:

```json
{
  "jobs": {
    "repositoryRoots": ["/srv/repositories"],
    "repositoryRemotes": ["https://github.com/your-organisation"]
  }
}
```

Then create and run a reusable review:

```bash
agent-control jobs create \
  --definition repository-code-review \
  --name "LocalWalks Nightly Review" \
  --node review-controller \
  --repository /srv/repositories/LocalWalks \
  --ref main \
  --scope changes \
  --model-role review.default \
  --schedule "0 2 * * *" \
  --timezone Europe/London

agent-control jobs saved
agent-control jobs run localwalks-nightly-review
agent-control jobs runs --saved-job localwalks-nightly-review
```

Job mutations use `AGENT_CONTROL_WEB_OPERATOR_TOKEN` only as a bearer header. The dashboard Jobs area provides separate Job Definitions, Saved Jobs, Schedules, and Runs views; its Saved Job form is generated from the definition parameter schema. See [`docs/jobs/README.md`](docs/jobs/README.md).

## External model registry

Agent Control now has a provider-neutral registry for external and local models. Providers own endpoint, wire protocol and secret references; models own provider model ID, capabilities, limits, pricing metadata and qualification state; logical roles such as `coding.fast` or `reasoning.deep` own ordered primary/fallback policy. Only a model qualified on the selected execution node can route. `UNTESTED`, `QUALIFYING`, `FAILED` and `DISABLED` entries remain visible but fail closed.

The dashboard **Models** tab shows provider/account/model identity, distinct provider-execution and credential-residency nodes, safe account label and plan authority, independent account/model qualification, limits, latency, configured pricing and fallback position. Parameterized Run and live token views separately show workload, execution, and credential nodes. The authenticated **Configuration** view can add or edit providers, account-profile references and models without storing API keys or OAuth material. See [`docs/models/README.md`](docs/models/README.md), [`docs/models/ADDING-A-PROVIDER.md`](docs/models/ADDING-A-PROVIDER.md), [`docs/models/CODEX-INTEGRATION.md`](docs/models/CODEX-INTEGRATION.md) and [`docs/credential-residency.md`](docs/credential-residency.md).

## Persistent Teammates

Agent Control 3.2 adds durable named teammates without turning names, roles or remembered context into authority. Profiles retain bounded instructions, preferred semantic capabilities, verifier-backed working-context summaries and explicitly saved or verified routines. Controlled conversations permit agent-to-agent delegation, while a Coordinator can assign work to two or more specialists and synthesize only their verifier-passed results.

Every specialist assignment and coordinator synthesis remains an ordinary Agent Control Job. Worker placement, provider/model selection, THIN/STANDARD/DEEP context routing, tool policy, token/cost telemetry, typed artifacts, verification and escalation all remain underneath the teammate layer. Initialize the five example profiles with `npm run init:teammates` and run the non-production two-specialist proof with `npm run demo:teammates`. See [`docs/persistent-teammates.md`](docs/persistent-teammates.md).

## Requirements

- Node.js 20 or newer
- npm
- Git
- Bash for shell-script validation and Android helpers
- Optional: ripgrep for typed repository search, Orca, SSH, Android/Termux, and provider services when configured

No host, device, provider, port, GPU, overlay network or absolute repository path is built in.

## Install

```bash
git clone https://github.com/lozknowles/agent-control.git
cd agent-control
npm install
npm run init
npm run check
```

`npm run init` creates only a schema-valid empty `.agent-control/config.json`. It is idempotent, never discovers infrastructure and never overwrites existing operator configuration. Use `config/agent-control.example.json` only as an illustrative reference after replacing every example endpoint, path and command.

Edit `.agent-control/config.json` for the installation. Runtime state and credentials remain ignored. A different path can be selected with `AGENT_CONTROL_CONFIG`. Do not put credentials in JSON; configuration names only the environment variable that supplies a credential.

With no configuration file, Agent Control starts with a safe local lane and reports infrastructure as `UNCONFIGURED`. It does not invent providers, machines or services.

## Run and monitor

```bash
npm start
npm run web
agent-control status
npm run up
npm run qualify
```

Run `npm link` once per installed node to expose the cross-platform `agent-control` package command. `agent-control status` (also available as `npm run status` inside the checkout) reads the same versioned `AgentControlService` projection as the web dashboard. A controller reads its localhost API; a worker uses a node-scoped SSH client configuration to perform one fixed read-only request against that same localhost API without exposing the dashboard listener. See [`docs/status-command.md`](docs/status-command.md). The older configured service/resource bootstrap inspection is retained as `npm run status:bootstrap`.

`npm start` opens the control-room TUI and its embedded web client. `npm run web` runs the same control service and web dashboard without the TUI for a headless operator host; run one authoritative control-plane process per state directory. `agent-control status` is read-only. `up` starts only explicitly configured services/processes and records ownership. `down` stops only processes that the same Agent Control state directory recorded as owned.

The TUI also starts the web dashboard on `http://127.0.0.1:4310` by default. The browser is an observer unless an operator token is explicitly configured:

```bash
export AGENT_CONTROL_WEB_OPERATOR_TOKEN="$(openssl rand -hex 32)"
npm start
```

Enter that token using **Observer mode** in the dashboard. It is retained only in the browser tab's session storage and sent as a bearer header; Agent Control does not create a browser authority cookie. Use `AGENT_CONTROL_WEB_ENABLED=0` to disable the dashboard or `AGENT_CONTROL_WEB_PORT` to select another port. Binding beyond localhost is an explicit security decision and should be placed behind authenticated TLS with a matching `AGENT_CONTROL_WEB_ALLOWED_ORIGINS` allowlist.

Monitor either interface for the same authoritative lanes, scheduler projection, providers, resources, PTY ownership, routing rationale and claim/evidence/verification state. The web terminal panel is observer-only; it never receives a PTY write primitive. Qualification writes timestamped JSON beneath ignored `qualification-results/`.

The dashboard's **Systems** tab is the canonical execution inventory. Every configured machine, provider and external service remains listed when it is unreachable, unprobed or missing authentication; those conditions are shown as `OFFLINE`, `UNKNOWN` or `AUTH REQUIRED` rather than hiding the system. **Models** is the model registry projection. After operator authentication, use **Configuration** to add or edit systems and models as validated JSON. Saves are revision checked and atomic. Provider, model and role-map changes hot-reload; machine and service changes explicitly require restart. See [`docs/web-dashboard.md`](docs/web-dashboard.md#configure-systems-and-models) for the operator procedure.

Configured Linux/SSH resources can opt into the generic `managedNode` policy. Agent Control then streams a fixed read-only inventory probe over the existing non-interactive SSH route, synchronises discovered capabilities and workload state into the Worker Registry, and shows the same heartbeat, `IDLE`/`BUSY`/`DEGRADED`/`OFFLINE` state, load, memory, storage, current workload and maintenance status in the dashboard, TUI, API and `agent-control status`. It installs no daemon and exposes no arbitrary SSH command surface.

Managed-node inspection and maintenance are typed Job Actions. Package/service/runtime/power operations require a named approval; an active protected workload additionally requires `managed-node.protected-workload-override`, and configured disruptive or competing capabilities are unavailable for placement while BUSY. See [`docs/managed-nodes.md`](docs/managed-nodes.md) for generic onboarding, discovery, operation and failure behavior.

## Token-aware command output

Agent Control can retain a command's authoritative stdout, stderr, exit status and provenance while presenting a much smaller derived view to a model. Command-shaped tool results cross this layer inside the existing `ToolHandlerRegistry`, after live tool/lease/ownership checks and before model context. Small results remain `COMPLETE`; larger results are explicitly `COMPACTED`, `TRUNCATED` or `ARTIFACT_ONLY` and receive a scoped, expiring handle.

The first semantic adapter is the read-only `repository.search.ripgrep` tool. It uses structured ripgrep output to return a summary or file/line match index, while `command.output.expand` can retrieve selected captured matches, files, ranges, context or the exact retained result. Expansion is bound to the original task, lane, worker and authority generations and cannot read arbitrary repository paths. Generic oversized command stdout uses a labelled head/tail view with the same full-result recovery path.

Agents use **Inspect -> Expand -> Read**. The context router selects summary, index, selected context or full artifact according to purpose and budget. The API and dashboard report per-command and cumulative **Context tokens avoided** without claiming provider billing savings. Configure thresholds with the optional `tokenAwareOutput` object shown in [`config/agent-control.example.json`](config/agent-control.example.json). See [`docs/token-aware-command-output.md`](docs/token-aware-command-output.md) for architecture, tool contracts, defaults, provenance and limitations.

## Harness efficiency and context budgets

The experimental [Local Context Compiler](docs/local-context-compiler.md) implements exact-evidence-preserving E2B/E4B triage, bounded Luna/Sol escalation, runtime qualification, five-way benchmark accounting, and routing audit telemetry. It is disabled by evidence: no local tier is usable until its physical runtime passes measured qualification, and no efficiency success is claimed without a complete frozen-corpus comparison.

Agent Control now records execution as a strategy, not just a model choice: model, provider, harness profile, context packet, tools, turns, cache observations and verifier outcome. The main process persists prompt-free invocation metadata in its protected state directory and shares that ledger with Job verification and dashboard projections. Provider usage is normalised into fresh, cached, cache-write, output, reasoning and total tokens where exposed; unavailable measurements and costs remain explicit `null` values. The dashboard's **Harness Efficiency** diagnostic reports token composition, cache effectiveness, escalation and cost per verified outcome without rewarding an unverified cheap run.

`ContextPacketBuilder` ranks exact evidence and keeps its provenance while recording every omitted source. `THIN` provides only bounded targeted context and required tools, `STANDARD` is the compatibility default, and `DEEP` permits wider graph/context retrieval for justified complexity. `HarnessProfileRouter` is observational by default: it can recommend a profile, but applies `STANDARD` until same-model, verifier-backed evidence is explicitly production-qualified. Escalation advances `THIN -> STANDARD -> DEEP` once and preserves packet/checkpoint references.

`ContextGraph` is a provider- and database-neutral port; its initial in-memory adapter proves queries, relationships, compact evidence and verified write-back without introducing a graph service. See [`docs/harness-efficiency-architecture.md`](docs/harness-efficiency-architecture.md) and the explicitly deterministic [`docs/harness-efficiency-report.md`](docs/harness-efficiency-report.md). Run the frozen 20-job experiment with `npm run benchmark:harness-efficiency`; its JSON counterpart is [`artifacts/harness-efficiency-report.json`](artifacts/harness-efficiency-report.json). The separate [`live same-model report`](docs/harness-efficiency-live-report.md) records provider tokens, cache behavior and latency from a controlled typed-tool run; it remains experimental evidence and does not enable production routing.

The opt-in real-mutation benchmark goes further: a live model receives only six typed, policy-gated repository tools and modifies a fresh disposable Git fixture. Hidden deterministic verifiers, public regressions, scope rules, syntax, `git diff --check`, and credential/topology scans decide success independently of model claims. It compares THIN, STANDARD, DEEP and cumulative THIN-to-STANDARD-to-DEEP escalation with the same model and settings. The recorded 12-task run did **not** qualify automatic routing: STANDARD and DEEP each verified 2/12 tasks, the adaptive strategy also verified 2/12 but consumed 255,213 processed tokens per verified outcome, and THIN verified 0/12. Production therefore remains observational with STANDARD applied. See [`docs/harness-mutation-report.md`](docs/harness-mutation-report.md) and [`artifacts/harness-mutation-report.json`](artifacts/harness-mutation-report.json).

The dashboard opens on the **Jobs** catalog. A Job can be started manually from the dashboard, requested through the authenticated API, or created by a timezone-aware Schedule; every trigger calls the same `createRun` path. Job detail includes schedule state, structured step progress, verification, placement, immutable artifact metadata and provenance. Queue inspection exposes age, priority, waiting reason, missing capabilities, eligible workers and resource locks; searchable Run history exposes duration and selected workers. Safe cancel, retry and named-approval controls still enter through `AgentControlService`. Use **Lanes** for interactive agent work. Press `J` in the TUI for the same authoritative Job/Schedule/Run projection.

## Jobs and schedules

Repository-managed YAML manifests beneath `config/jobs/` define versioned Jobs and separate Schedules. JSON Schema validation, typed parameters, dependency checks and Action registration fail closed at load time. Jobs request semantic capabilities and resources; they never name a host. Configured resources become workers by advertising those capabilities, and Agent Control records why each worker was selected or rejected.

```bash
npm run qualify:jobs
```

The qualification Job is deliberately non-production and its twice-daily `07:00/19:00 Europe/London` Schedule is disabled. Enabling a Schedule does not grant a requested capability or approval. See [`docs/jobs-and-scheduler.md`](docs/jobs-and-scheduler.md) for the manifest contract, custom-Job example, Run states, artifact handoff, locks, retries and operator procedure.

## Configuration model

The versioned JSON schema has six independent collections/policies plus optional output, harness-efficiency, and parameterised-job policies:

- `resources`: identity, platform, transport and semantic capabilities;
- `providers`: provider identity, API endpoint, wire protocol, authentication reference and capabilities;
- `models`: stable model identity, provider model ID, declared capabilities, node scope, limits, qualification and optional sourced pricing;
- `modelRouting`: logical role to ordered primary/fallback model mappings and an optional default role;
- `services`: health endpoint and optional explicit start recipe;
- `lanes`: lane identity, working directory, priority and AUTO/MANUAL mode.
- `tokenAwareOutput`: provider-neutral completeness, index, artifact, retention and context-budget thresholds.
- `harnessEfficiency`: observational/enforced routing mode, verifier-evidence thresholds and configurable THIN/STANDARD/DEEP budgets. `observe` is the safe default.
- `spark`: optional, default-disabled fast-execution policy: exact model/registry role, one-file/line/context limits, one attempt, zero subagents, and mandatory independent verification.
- `jobs`: allowed node-local repository roots and optional allowlisted HTTPS/Git remote prefixes for parameterised repository jobs.

Resource identity is separate from transport. A resource may be local, SSH, HTTP or Orca-backed. An SSH hostname is transport metadata, not the resource ID. Ports are configurable numbers. Optional unavailable services do not make an otherwise valid zero-provider installation fail.

Providers and external services that require API keys use `auth.env`, `credentialEnv` or `credentialFileEnv` to name the runtime environment variable that supplies the secret. The configuration stores only that reference. Plaintext API keys, passwords, tokens, secrets and credentialed URLs are rejected.

For a managed Linux resource, `managedNode` adds polling/heartbeat policy, declarative protected-workload detectors, approved services, BUSY capability fences and an optional operator-reviewed runtime update target. Hardware, package tools, filesystems, optical devices, secure-overlay state and operational capabilities are discovered rather than assumed. Real endpoints and workload identifiers remain operator configuration, never core defaults.

See [`config/agent-control.example.json`](config/agent-control.example.json), [`ARCHITECTURE.md`](ARCHITECTURE.md), and [`docs/concepts.md`](docs/concepts.md). The older [`docs/architecture-v2.md`](docs/architecture-v2.md) remains a configuration-neutrality appendix.

## Adaptive harness

`AdaptiveHarness` assembles an execution recipe from policy-approved components. The fingerprint now includes harness profile and context strategy alongside model/provider identity. `SkillCatalog` selects only qualified skills with qualification evidence. `ToolPolicy` produces an explicit minimum grant and revalidates the lane, lease generation, ownership generation and human-owner fence at tool use. `EconomicRouter` rejects unhealthy, unqualified, incapable, over-budget, low-confidence or unapproved routes before comparing effective monetary, latency, occupancy, contention, failure/retry and quality costs.

The same task can therefore receive different scaffolding. A strongly qualified model may use a direct prompt with no extra skill; a smaller model may use a guided profile, a qualified task skill, narrower context and fewer tools. Both remain subject to the same Agent Control authority and verification policy.

Current boundaries are intentional:

- the catalog selects already-qualified skills but does not create, qualify or approve new ones;
- normal Work Queue agent dispatch is recipe-backed, persisted/inspectable and stops at `verification-pending` rather than accepting process completion;
- named control operations such as Android provisioning are explicit, scope-checked exceptions and cannot become a legacy agent fallback;
- the generic `AgentAdapter` receives only the recipe and policy gateway, but Orca/SSH CLI-internal tools are opaque to Agent Control and are not yet qualified as universally moderated tool calls;
- model-backed Job Actions are qualified through the sole `HarnessJobAgentAction` bridge; they enter through `HarnessDispatcher`, receive only policy-gated tools and stop at verification rather than treating model completion as acceptance;
- model qualification and successive halving operate on recipe fingerprints, but governed skill generation and automated recipe learning remain follow-on 3.1 work.

## Durable work and evidence

Agent Control persists hard contracts, revisioned batons, append-only events, checkpoints, Work Queue state and shared context metadata. Handoffs may include a compact baton, Git/test evidence and selected provider-neutral context sources. Git and independently reproducible tests remain authoritative; shared threads are optional read-only context and never required for recovery.

The Work Queue supports interactive, priority, background and batch work, dependencies, capability selection, data locality, quiet periods, maintenance windows, homogeneous batch leases, item-by-item commit, checkpoints, retries and low-confidence human review. The Job runtime adds reusable multi-step workflows above those atomic scheduling concepts: a durable Run ledger, timezone-aware triggers, step dependencies, resource locks, typed artifacts, bounded retries, approval waits and verification gates.

Agent completion is modeled as `CLAIMED -> EVIDENCE_COLLECTED -> VERIFIED -> ACCEPTED`. A claim cannot satisfy a verification-required task. Lane policy can require minimum-sufficient evidence such as a Git commit, diff, test/build result, file hash, API result, UI evidence, benchmark, external source or human approval. Failed required evidence blocks verification, and acceptance remains a separate explicit action.

Routing is capability-qualified and fail closed. Eligible routes may be compared using capability, provider health, reliability, monetary cost, latency, expected duration, context/tool requirements, privacy, local/GPU availability, priority, urgency and operator preference. The selected route, alternatives and plain-language rationale are stored with the lane.

Model/provider qualification already records complete model recipes including runtime, context size, chat template, prompt version, skill/tool snapshots and inference parameters. Overnight experiments use successive halving across strategy fingerprints that can also identify provider, harness profile and context strategy. A challenger must preserve verifier-gated quality before cost or fresh-token efficiency can break a tie; fewer tokens alone never promote it.

## Authority and safety

- Human takeover is unconditional and fences agent input.
- One PTY has at most one logical owner.
- Missing or stale execution identity fails closed to disconnected/recovering/unknown state.
- Provider/context failures cannot mutate leases, ownership, scheduling or PTYs.
- Recovery uses explicit configured recipes and existing credentials.
- Agent Control never stores secret material in product configuration.
- Shared URLs are attached only when already explicitly shared; creating/broadening sharing requires separate approval.
- The browser has no direct lease, scheduler, persistence or PTY-input endpoint.
- External context and provider adapters remain non-authoritative regardless of interface.

## Orca execution boundary

The execution contract is intentionally replaceable: start, status, reconnect, input, pause, resume, cancel, output, diff and cleanup. Agent Control validates task/session identity, lease generation, ownership generation, host, repository, worktree, branch and nonce before accepting recovery. Orca convenience features cannot bypass those checks through the supported adapter.

## Android

Android is one optional resource type, not a named device. The bundled Termux node advertises observed capabilities and accepts only the allow-listed read-only log observation job. Provisioning has explicit privilege, wireless-pairing and reboot approval gates. See [`android/README.md`](android/README.md).

## Validation

```bash
npm run typecheck
npm run check:bootstrap
npm run check:neutrality
npm test
npm run check
npm run qualify:jobs
npm run benchmark:token-output
npm run benchmark:harness-efficiency
git diff --check
```

`npm run benchmark:harness-mutation:live` is a separate, opt-in live experiment. It requires an explicitly qualified OpenAI-compatible endpoint/model in environment variables and never runs as part of the ordinary local gate.

The neutrality guard rejects private topology identifiers in distributable runtime, tests, documentation, filenames and examples. The audit ledger and changelog are explicit historical exceptions.

## Current limitations

- Orca remains optional and the existing execution path remains available as fallback.
- Reboot recovery is qualified only per explicitly tested environment; source support is not a universal live qualification claim.
- OpenAI ChatKit access uses official supported APIs and remains qualified only for the exact tested project/thread state recorded in provider evidence.
- ChatGPT Work and Codex shared task context remain host/reference-only unless an official read API is available.
- Windows OpenAI execution is switchable: `auto` prefers a configured Responses API key and otherwise uses official Codex non-interactive execution with the saved ChatGPT-plan login. Both the Responses API and ChatGPT-plan routes are live `SUPPORTED+QUALIFIED` through the adaptive harness and central tool gate; ChatGPT desktop-window automation remains unimplemented and untested.
- Skill proposal, security review, sandbox qualification, approval and promotion remain follow-on 3.1 work; an unqualified proposal cannot be selected by the current catalog.
- `config/implementation-status.json` is the machine-readable implementation boundary. `npm run status:implementation` renders it for inspection and `npm run check:status` fails when the generated [`docs/implementation-status.md`](docs/implementation-status.md) projection or its evidence paths are stale.
- The Job Catalog, Worker Registry, Run Ledger and web dashboard are implemented in 3.1.0. Model-backed Job Actions enter through `HarnessJobAgentAction`; each production provider still requires its own live qualification.
- No production deployment is performed by this repository release process.
- The events workflow is qualified only against a safe fixture target; authenticated Facebook discovery and the existing LocalWalks production publisher are not invoked or production-qualified by this source change.
- Ripgrep is the only semantic command-output adapter in this change. Other oversized command families use the generic labelled fallback until a specialised index is added. A tiny typed ripgrep request retains its structured authoritative stream and therefore can be larger than normal human-formatted `rg`; it is not compacted merely because it came from ripgrep.
- Harness-profile routing remains observational. A live same-model repository-mutation experiment now measures provider tokens, observed warm-cache behaviour, latency, independent verifier outcomes and cumulative escalation cost, but its 12-task sample had only 2/12 STANDARD successes and no adaptive resource advantage. No profile is production-qualified; STANDARD remains the applied fallback and monetary cost remains unknown.

The foundational operator guide is [`docs/Agent-Control-3.1.0-Operator-Guide.md`](docs/Agent-Control-3.1.0-Operator-Guide.md), distributed as [Markdown](assets/releases/3.1.0/Agent-Control-3.1.0-Operator-Guide.md) and [PDF](assets/releases/3.1.0/Agent-Control-3.1.0-Operator-Guide.pdf). For current operation, use [`docs/governed-retrieval.md`](docs/governed-retrieval.md), [`docs/credential-residency.md`](docs/credential-residency.md), [`docs/token-aware-baton-routing.md`](docs/token-aware-baton-routing.md), [`docs/provider-model-lifecycle.md`](docs/provider-model-lifecycle.md), [`docs/models/CODEX-INTEGRATION.md`](docs/models/CODEX-INTEGRATION.md), [`docs/web-dashboard.md`](docs/web-dashboard.md), and [`ARCHITECTURE.md`](ARCHITECTURE.md). Release scope and migration guidance are in the [`3.8.1 release notes`](docs/release-notes-3.8.1.md) and [`3.8.1 migration guide`](docs/migration-3.8.1.md); historical releases remain immutable.
