# Agent Control 3.0.1 infrastructure-agnostic audit

Audit date: 2026-08-24
Audited baseline: `v3.0.0` / `617200889977fbef7e0358557feab6932583b0df`
Branch: `release/3.0.1-infrastructure-agnostic`

This document begins with the immutable pre-change ledger. The remediation and post-change verification sections are completed only after implementation and validation. `v3.0.0` remains unchanged.

## Pre-change audit method

The audit enumerated all 117 tracked paths and scanned tracked filenames and file contents case-insensitively for private host, device, user, hardware, network, path and port identifiers. It separately inspected bootstrap, provider, host/resource, TUI, Android, qualification, persistence, execution-provider and documentation/evidence behavior. String absence alone is not treated as architectural proof.

## Pre-change finding ledger

| ID | Classification | Severity | Finding | Affected tracked files |
| --- | --- | --- | --- | --- |
| AC-IA-001 | RUNTIME-HARDCODE | P0 | Bootstrap encodes a complete private topology: two llama services, two ChatGPT Window services, one Android forward, fixed ports, a fixed remote host probe, systemd discovery by port, Tailscale as mandatory reachability, a private Android UID/hostname/key/repository default and fixed SSH forwarding. | `scripts/control-plane.mjs` |
| AC-IA-002 | RUNTIME-HARDCODE, SECRET/PRIVACY-RISK | P0 | TUI startup seeds private project lanes and absolute paths, creates a fixed Android controller with private host/user/key/repository defaults, uses a private token filename, and presents device-specific controls as product controls. | `src/index.ts` |
| AC-IA-003 | RUNTIME-HARDCODE | P0 | The built-in fleet treats named development machines, specific GPU models, Tailscale SSH, Android hardware and a fixed controller as the product resource model. | `src/control/hosts.ts`, `src/control/hosts.test.ts` |
| AC-IA-004 | RUNTIME-HARDCODE | P0 | Android recovery is product-named, requires Tailscale before SSH, fixes remote node port `8788`, assumes an existing forward, uses a device-specific log name and embeds device identity in telemetry and status. | `src/control/pixel-recovery.ts`, `src/control/pixel-resource.test.ts`, `src/ui/control-room.ts`, `src/ui/control-room.test.ts` |
| AC-IA-005 | CONFIG-DEFAULT | P0 | Providers are always registered with fixed loopback endpoints `8080` and `8767`, so zero-provider, API-only and alternate-port installations require source edits. | `src/control/providers.ts`, `src/control/providers.test.ts`, `src/index.ts` |
| AC-IA-006 | RUNTIME-HARDCODE | P1 | Qualification always assumes the original Linux host role, a specific Android resource/forward and device-specific environment variables; optional remote examples name the private remote host. | `scripts/qualify-all.mjs`, `scripts/qualify-remote.sh`, `scripts/prove-pixel-resolution.ts` |
| AC-IA-007 | RUNTIME-HARDCODE, CONFIG-DEFAULT | P1 | Android provisioning command, mission IDs, defaults, artifact state and tests use the original device identity, private UID/host and repository name. | `scripts/provision-pixel.mjs`, `scripts/provision-pixel.test.mjs`, `src/control/android-provisioning*.ts`, corresponding tests |
| AC-IA-008 | RUNTIME-HARDCODE, CONFIG-DEFAULT | P1 | Android boot/node scripts use a device-specific agent filename, repository path and log path; the node server and start script bake in port `8788` without separating protocol default from deployment override. | `android/pixel-agent.sh`, `android/install-boot.sh`, `android/termux-boot-agent-control.sh`, `android/start-node.sh`, `android/node-server.mjs` |
| AC-IA-009 | RUNTIME-HARDCODE, TEST-FIXTURE | P1 | Product tests and fixtures repeatedly use private host/resource names. Some tests thereby validate the private topology rather than arbitrary identities. | `src/control/*test.ts`, `src/control-plane.test.ts`, `scripts/*.test.mjs` |
| AC-IA-010 | CONFIG-DEFAULT | P1 | Package scripts make device-specific provisioning canonical and expose no generic configuration validation or neutrality scan. | `package.json` |
| AC-IA-011 | RUNTIME-HARDCODE, TEST-FIXTURE | P1 | Tracked runtime filenames themselves encode the original hardware as a product concept. | `android/pixel-agent.sh`, `scripts/provision-pixel.mjs`, `scripts/provision-pixel.test.mjs`, `scripts/prove-pixel-resolution.ts`, `src/control/pixel-recovery.ts`, `src/control/pixel-resource.test.ts` |
| AC-IA-012 | DOCUMENTATION | P1 | Product documentation presents the development machines, ports, systemd/Tailscale topology and physical device as normal installation architecture. | `README.md`, `TEST-TONIGHT.md`, `TODO.md`, `android/README.md`, `docs/architecture-v2.md`, `docs/qualification.md`, `docs/remote-qualification.md`, `docs/ui-target.md`, `assets/article/agent-control-2.0-source-article.md`, `CHANGELOG.md` |
| AC-IA-013 | HISTORICAL-EVIDENCE, SECRET/PRIVACY-RISK | P1 | Evidence preserves private hostnames, usernames, paths, topology and device-specific resource identities. The engineering results are useful but public evidence does not require those identities. | `docs/evidence/agent-control-2.0-live-qualification-20260819.md`, `pixel-capability-resolution-pass-20260818.md`, `pixel-observer-pass-20260818.md`, `pixel-remote-node-pass-20260818.md`, `pixel-self-recovery-qualified-20260819.md`, `provider-live-qualification-20260823.json`, `context-consensus-demo-20260823.json` |
| AC-IA-014 | RUNTIME-HARDCODE | P1 | Consensus demo uses `/fast/repos/agent-control` as repository identity and persists it into generated evidence. | `scripts/demo-context-consensus.mjs`, `docs/evidence/context-consensus-demo-20260823.json` |
| AC-IA-015 | CONFIG-DEFAULT | P1 | Remote qualification defaults to `/fast/repos/agent-control`; a clean unrelated installation cannot use the bounded entrypoint without an override. | `scripts/qualify-remote.sh`, `docs/remote-qualification.md` |
| AC-IA-016 | RUNTIME-HARDCODE | P1 | Owned-process reconciliation gives the Android forward special semantics by ID instead of treating all configured owned processes uniformly. | `scripts/owned-processes.mjs`, `scripts/owned-processes.test.mjs` |
| AC-IA-017 | DOCUMENTATION | P2 | The 3.0 README contains an outdated `110/110` checkpoint while the release gate is `151/151`, and combines historical qualification with current product requirements. | `README.md` |
| AC-IA-018 | BENIGN-STANDARD | INFO | Loopback addresses, HTTP `/health`, Git metadata, `.agent-control/`, `.env` ignores, `#!/usr/bin/env`, Termux shebangs and `/usr/local/libexec` are protocol/platform conventions when documented and overrideable; they are not private topology by themselves. | Multiple runtime/scripts/docs files |
| AC-IA-019 | BENIGN-STANDARD | INFO | `8022` and `8788` may be useful example/default ports for Termux SSH and the bundled Android node, but must be explicit configurable example/protocol values rather than private deployment assumptions. | Android scripts/config examples/tests |
| AC-IA-020 | HISTORICAL-EVIDENCE | INFO | Google Pixel model names may be retained only when exact physical hardware is technically relevant qualification metadata. They must not appear as runtime resource identity, default, command or required topology. | Historical evidence only after remediation |

## Pre-change architectural verdict

`FAIL - INFRASTRUCTURE SPECIFIC`

At `v3.0.0`, an unrelated user cannot configure differently named machines, alternative ports, another Android device, no Tailscale and a different provider mixture without editing source. The failure is caused by runtime/bootstrap and registration assumptions, not only documentation.

## Remediation record

| Finding | Remediation | Verification |
| --- | --- | --- |
| AC-IA-001, 005, 015, 016 | Replaced topology discovery and service special cases with `AgentControlConfig`, `scripts/config.mjs`, generic owned-process reconciliation and configuration-driven `control-plane.mjs`. Missing config returns `UNCONFIGURED`. | `scripts/control-plane-config.test.mjs`, `scripts/owned-processes.test.mjs`; release gate PASS. |
| AC-IA-002, 003 | TUI, hosts and providers now load only configured lanes/resources/providers. The fallback UI has one local unassigned lane and no provider/resource authority. | `src/control/config.test.ts`, `hosts.test.ts`, `providers.test.ts`; typecheck PASS. |
| AC-IA-004, 007, 008, 011 | Renamed device-specific files and generalized Android node identity, provisioning IDs, recovery, transport, paths, credentials and UI labels. Removed required overlay-network discovery. | Android provisioning/recovery/UI tests PASS; shell syntax PASS. |
| AC-IA-006 | Qualification reads the shared config, checks only configured endpoints and records missing infrastructure as an explicit skip. Remote root resolves from the script location. | `npm run qualify`: PASS, configured infrastructure SKIP in zero-config test environment. |
| AC-IA-009 | Replaced private fleet names in fixtures with arbitrary controller/worker/mobile IDs and added stale-host recovery rejection. | 156/156 serial tests PASS. |
| AC-IA-010 | Added `provision:android`, `check:neutrality`, expanded bootstrap syntax validation and version 3.0.1 package metadata. | `npm run check` PASS. |
| AC-IA-012, 017 | Rewrote README, root architecture, infrastructure architecture, qualification, remote and Android guidance. Replaced outdated test-count claims. Added a rendered 3.0.1 operator guide. | Manual documentation review; seven-page PDF rendered/extracted/visually inspected. |
| AC-IA-013 | Removed raw private-fleet narratives from the distributable tree and added a redacted legacy engineering summary. Original evidence remains recoverable at immutable `v3.0.0`. Sanitized retained JSON fixtures. | Prohibited-string scan PASS; tracked secret/path review PASS. |
| AC-IA-014 | Consensus demo/evidence uses a neutral example repository location. | Serial context/provenance tests PASS. |
| Project-specific observer | Removed the application-specific social-media observer, test and command from the generic product. This behavior remains recoverable in `v3.0.0` but is not an Agent Control 3.0.1 subsystem. | Tracked-tree and package-script review. |

## Retained constants and justification

- `127.0.0.1` is the safe default bind for the bundled Android node and a valid example loopback endpoint.
- `8788` is retained only as the overrideable bundled Android node protocol default in `AGENT_CONTROL_NODE_PORT` and as an explicitly labelled example remote URL.
- `8022` appears only as an explicit example SSH port common to Termux; deployments may choose any configured port.
- HTTP `/health`, `/v2/resource` and `/v2/jobs` are protocol paths, not infrastructure identity.
- `.agent-control/`, `.env*`, `qualification-results/` and `.pdf-review/` are local state/secret/evidence exclusions.
- `/usr/local/libexec/agent-control-privileged` remains an administrator-installed, fixed, root-owned allow-list helper path; its fixed location is a security boundary rather than private topology.
- The audit ledger and changelog retain historical identifier text so the remediation is reviewable. They are explicit regression-guard exceptions; no runtime, example, current guide or retained raw evidence is excepted.

## Tests added

- Safe zero-resource/provider/service `UNCONFIGURED` start and idempotent `up`.
- Arbitrary service port health and optional unavailable-service behavior.
- Arbitrary resource/provider names, ports, provider models and transport types.
- API-only with no local resources/models.
- Two differently named Android devices/models using one schema.
- Android config-driven provisioning and honest unsupported transport state.
- Stale transport hostname cannot prove original Orca execution or grant input.
- Stale lease/ownership rejection and takeover fence survival remain covered.
- Tracked filename/content prohibited-string guard plus no required named overlay product.

Final serial total: **156/156 PASS** (baseline 151/151).

## Post-change prohibited-string and architecture review

### Automated/source scan

`npm run check:neutrality` passed three guards covering tracked filenames, distributable text, and runtime dependency on the previously required overlay-network vendor. A separate case-insensitive scan found no occurrences outside the explicit audit/changelog exceptions of the private hostnames, Android hostname/model, Termux UID, private absolute paths, prior Android repository name or original GPU identifiers. A separate scan found no runtime/documentation references outside historical exceptions to the original private service/forward ports `8080`, `8081`, `8766`, `8767` or `18788`.

### Required topology scenarios

| Scenario | Result | Evidence class |
| --- | --- | --- |
| A. Arbitrary machine names, ports and Android models | PASS | Automated tests with non-original IDs and ports. |
| B. No named overlay-network product installed | PASS | Source verified: runtime contains no dependency; SSH/HTTP are explicit transports. No live network removal was performed. |
| C. API-only installation | PASS | Automated configuration test. |
| D. No local model services | PASS | Automated zero-provider/service bootstrap test. |
| E. Two different Android models | PASS | Automated schema/capability tests. |
| F. Stale hostname/resource mapping | PASS | Orca reconnect test changes host identity, produces `UNKNOWN`, and rejects input. |

### Commands and results

Executed from an isolated copy of this branch on Linux without touching managed/production services:

```text
npm install                       PASS (0 vulnerabilities)
npm run typecheck                 PASS
npm run check:bootstrap           PASS
npm run check:neutrality          PASS (3/3)
npm test                          PASS (156/156)
npm run check                     PASS
npm run qualify                   PASS (local gate PASS; configured infrastructure explicitly SKIP in zero-config environment)
git diff --check                  PASS
```

PDF evidence:

- asset: `assets/releases/3.0.1/Agent-Control-3.0.1-Operator-Guide.pdf`
- pages: 7, A4, unencrypted, no JavaScript
- SHA-256: `6e3ce057692b0c62fa5fcefd859e644fa18553c5a371309f35e3b39082d1ece8`
- validation: Poppler metadata/text extraction PASS; all seven rendered pages visually inspected with no clipping or overlap.

### Non-actions and limitations

- No service, machine, firewall, network overlay, Android device, credential, provider or production deployment was changed.
- The configuration/authority architecture is source- and test-verified. This audit does not turn optional remote/provider/reboot features into universal live qualifications.
- The built-in execution path remains available as rollback/fallback; no runtime implementation was retired solely because Orca exists.

## Final verdict

`PASS - INFRASTRUCTURE AGNOSTIC`

An unrelated user can use different machine/resource names, ports, Android models, API-only providers, no local models and no named overlay network without editing source. All infrastructure is opt-in configuration. Agent Control authority and fail-closed recovery semantics remain intact.
