# STK Builder

Browser-based Sonicware SmplTrek drum kit creation and editing. Process samples locally in the browser and support STK import/export with explicit sample-slot assignments.

## Stack and conventions

- Follow `/Users/ryanveitch/nodejs/rveitch/rnd-synth-midi-control` for configuration conventions: Vue 3 Composition API, TypeScript, Vite, Vitest, and flat ESLint configuration.
- Use Node 24 as specified by `.nvmrc`.
- Keep business logic in src/core independent of Vue, DOM, Node filesystem, Web Audio, and WebMCP. Interfaces share core validation and inspection. Environment adapters own file access and audio.
- WebMCP is optional and opt-in. Preserve revocation and current-kit semantics; never return audio bytes through inspection tools.
- Use strict TypeScript, including unchecked-index checking.
- Prefer const variables, camelCase names, and named module-level function declarations. Reserve arrow functions for callbacks and closures.
- Avoid unary increment/decrement operators and em dashes in user-facing prose.
- Test commands must exit when complete; use `vitest run` for the default test command.
- Validate tests, type checking, lint, build, and `git diff --check` once those scripts exist. Check IDE diagnostics for changed code when available.

## Format evidence and UI conventions

- Slots are numbered 1 through 15 in the UI and indexed 0 through 14 in sample chunks.
- Upper pads, left to right: 2, 4, 6, 8, 10, 12, 14. Lower pads: 1, 3, 5, 7, 9, 11, 13, 15.
- Rock kit assignments are an optional starting template, not restrictions on sample placement. Slot 3 is Snare 1; slot 4 is Snare 2.
- Observed slot records are 280 bytes with a 256-byte sample path followed by 24 parameter bytes.
- Device-correlated fields relative to each slot record: level at 0x100, signed pan at 0x101, FX send at 0x110, choke group at 0x111.
- User confirmed level range 0 through 127, default 100. Pan 0 is center, negative values are left, positive values are right. Pan and choke range limits remain unverified.
- Preserve unknown fields and distinguish observed values from established format rules. The current evidence does not establish every parameter or STK variant.
- PO20 demonstrates empty slots; do not automatically fill unused slots with duplicate samples.
- Rock kit WAVs have only fmt/data chunks and no sample trailing padding; PO20 WAVs include cue/LIST metadata and two trailing bytes per sample chunk. Do not hardcode one layout for all inputs.
- Keep source kits and supplied layout reference files unchanged.

## Licensing

- The project is intended to use MIT licensing. Independently implement from verified format observations.
- The community `jblamber/stk_writer` code is LGPL 2.1. Do not copy or directly translate that code into MIT-only source.
- Do not assume factory samples or third-party artwork are covered by this repository's code license.
