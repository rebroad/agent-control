# Repository Guidelines

## Project Structure & Module Organization

The runtime is a TypeScript/Node.js control plane. Application entry points are in `src/index.ts` and `src/state.ts`; control-plane modules live under `src/control/`, with their tests colocated beside them. `src/ui/` contains terminal UI styling and presentation helpers. Keep operational scripts in `scripts/`, Android node/agent integration in `android/`, and design, qualification, and evidence material in `docs/`. `README.md` and `ARCHITECTURE.md` describe the intended model and invariants; update them when behavior or contracts change.

## Build, Test, and Development Commands

Run commands from the repository root after installing dependencies with `npm install`:

```bash
npm run check       # TypeScript validation followed by the full Node test suite
npm test            # Run colocated tests with Node's test runner and tsx
npm run typecheck   # Run tsc without emitting files
npm run dev         # Start the TUI with tsx watch
npm start           # Start the TUI once
npm run qualify:all # Run local and configured cross-platform qualification checks
```

Use `AGENT_CONTROL_STATE_DIR=/path/to/state npm start` to isolate runtime state. Qualification writes timestamped evidence under `qualification-results/`; do not commit credentials or generated runtime state.

## Coding Style & Naming Conventions

Use TypeScript ESM and follow the existing compact, straightforward style. Use two-space indentation, semicolons, single quotes, and explicit types at public boundaries. Name variables and functions in `camelCase`, types/classes in `PascalCase`, and constants in `UPPER_SNAKE_CASE` only when they are true constants. Prefer existing domain types and small pure helpers over new abstractions. No formatter or linter is configured, so keep changes consistent with neighboring files and run `npm run typecheck`.

## Testing Guidelines

Tests use Node's built-in test runner through `tsx`; name files `*.test.ts` and place them beside the implementation. Add focused tests for state transitions, routing, provider behavior, PTY handling, and failure paths. `npm run check` is the required baseline; manually exercise TUI focus, scrolling, modals, and keyboard controls with `npm start` when UI behavior changes.

## Commit & Pull Request Guidelines

Use short, imperative, lowercase commit subjects, for example `test telemetry percentile summaries` or `add generic remote capability node client`. Keep commits focused. Pull requests should explain the user-visible or architectural effect, identify validation commands and any skipped live qualification, link relevant issues/evidence, and include terminal screenshots or reproduction steps when changing the TUI.
