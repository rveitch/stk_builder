# STK Inspector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Import, inspect, and audition SmplTrek kits locally, with optional read-only WebMCP tools sharing the same core.

**Architecture:** Pure TypeScript parses bytes into preserved kit records and produces bounded inspection results. Browser adapters handle files and playback; Vue and WebMCP consume shared inspection functions. A CLI can later reuse the core without browser globals.

**Tech Stack:** Node 24, Vue 3 Composition API, TypeScript, Vite, Vitest, ESLint flat config, plain CSS.

**Spec:** `docs/superpowers/specs/2026-10-06-stk-inspector-design.md`

## Global Constraints

- Use the existing checkout; preserve unrelated changes. No push or deployment in this plan.
- Follow the reference repo's strict TypeScript and ESLint conventions; use named module-level functions, camelCase, const, and no unary increments/decrements.
- Core imports no Vue, DOM, Node filesystem, Web Audio, or WebMCP APIs.
- 15 slots: upper 2/4/6/8/10/12/14; lower 1/3/5/7/9/11/13/15.
- Input limit 64 MiB, checked before browser file reads and at the core boundary.
- No STK writing, kit mutation, conversion, persistent library, or device-DSP emulation yet.
- Preserve unknown bytes. Identify provisional interpretations explicitly.
- Do not commit third-party audio, kit files, photos, manuals, or translated LGPL source.
- Default tests exit via `vitest run`; run typecheck, lint, build, diff checks, and IDE diagnostics where available.

## Review Focus

- Truncated or enormous declared lengths must fail without out-of-bounds reads or unbounded loops (task 1).
- Unknown WAV encodings must remain inspectable without pretending preview is supported (tasks 1/3).
- Late completion of an older import must not replace the latest selection (task 3).
- Playback decoding that completes after stop/replacement must not begin playing (task 3).
- Agent calls after kit replacement or assistance disable must not expose stale state (task 4).

## File map

- `src/core/types.ts`: preserved kit, slot, sample, chunk, diagnostic, and inspection types.
- `src/core/readWav.ts`, `src/core/readStk.ts`: bounds-checked binary readers.
- `src/core/inspectKit.ts`: JSON-safe summary/slot/diagnostic projections.
- `src/core/*.test.ts`, `src/core/testFixtures.ts`: synthetic fixtures and format tests.
- `src/presentation/padPalette.ts`, `src/presentation/padLayout.ts`: palette and physical layout.
- `src/audio/createPreviewPlayer.ts`: cancellable browser audio lifecycle.
- `src/composables/useKitInspector.ts`: import lifecycle and Vue state.
- `src/components/KitImport.vue`, `PadGrid.vue`, `SlotDetails.vue`, `AgentAccess.vue`: user interface.
- `src/agents/inspectionTools.ts`, `webMcpAdapter.ts`: pure tool handlers and optional host registration.
- `src/App.vue`, `src/main.ts`, `src/styles.css`, `src/env.d.ts`, `index.html`: app entry and styling.
- Configuration: `package.json`, lockfile, Vite/TypeScript/ESLint configs; update `README.md` and `AGENTS.md`.

## Task 1: Validated STK and WAV core

**Interfaces:** `readStk(bytes: Uint8Array): Kit`; `readWav(bytes: Uint8Array): WavInfo`. `Kit` retains source bytes, all 15 slots, chunk ranges, outer header fields, and diagnostics. Each slot has index, path, raw record, decoded parameters, and an optional embedded sample. Diagnostics use severity, code, message, and optional slot/offset. Invalid structure throws a typed error with code and offset.

- [ ] Add the minimal package/config setup needed to run TypeScript Vitest tests, following the reference config families. Record the resolved dependencies in the lockfile; omit reference MIDI/Python scripts. Include strict unchecked-index checking and a configurable Vite base path.
- [ ] Write synthetic fixture tests before the parser. Fixtures construct independent known bytes with configurable sample indices, WAV chunks, and trailing bytes. Assert a 15-slot result, sparse indices `[0,2,4,5,6,7,8,9,11]`, Tom1 values `{level:56, pan:-53, fxSend:46}`, signed pitch `-200`, and unchanged source bytes.
- [ ] Run `npm test -- src/core/readStk.test.ts src/core/readWav.test.ts`; confirm missing-implementation failures.
- [ ] Implement bounded readers: KTDT at 16, records at 32, full KTDT chunk size 4228, record stride 280. Traverse declared chunk sizes, not signature scans. Decode confirmed parameters and retain raw data. Use ISDT indices for assignment. Validate paths/sample association and report missing samples instead of fabricating them.
- [ ] Read WAV fmt/data and arbitrary ancillary chunks with word alignment. Expose format code, channels, sample rate, bit depth, and duration where computable. Unsupported encodings yield diagnostics and a disabled preview, not guessed PCM interpretation.
- [ ] Add cases for no trailing bytes versus two trailing bytes, odd WAV subchunks, zero-sized/overrunning container chunks, duplicate indices, index 15, truncation at each header boundary, missing fmt/data, and unknown bounded chunks. Accept the observed outer-size variations without using that field as the buffer boundary. Unknown metadata markers generate diagnostics.
- [ ] Run focused tests and typecheck; verify malformed-length cases finish promptly. Commit only task files.

## Task 2: Shared inspection API and presentation data

**Interfaces:** `getKitSummary(kit: Kit): KitSummary`; `getSlotDetails(kit: Kit, slotNumber: number): SlotDetails`; `getValidationFindings(kit: Kit): Diagnostic[]`. Slot numbers at this public boundary are 1-15. Result objects contain no source buffers or WAV payloads. `padRows` contains the two explicit physical rows. `getPadColor(storedValue: number)` returns a provisional device number and swatch, or an unknown fallback.

- [ ] Write projection tests asserting JSON serialization, all 15 slots including empty entries, no audio/raw buffers, and rejection of slot 0, 16, fractions, NaN, and infinities. Assert the exact upper/lower row arrays.
- [ ] Run `npm test -- src/core/inspectKit.test.ts src/presentation/padLayout.test.ts`; confirm expected failures.
- [ ] Implement the projections and presentation data. Use signed pan formatting (`CTR`, `L53`, `R53`), raw choke codes, and explicit confidence metadata for pitch and color. Unknown kit settings remain undecoded. Keep raw byte inspection a separate UI-only view.
- [ ] Build 30 approximate palette swatches from the supplied photo ordering. Photo A upper uses 2-14 even, lower 1-15 odd; photo B upper 17-29 odd, lower 16-30 even. Label swatches by number; do not claim calibrated LED colors.
- [ ] Run focused tests and typecheck. Commit task files.

## Task 3: Browser import, inspection, and audition UI

**Interfaces:** `createPreviewPlayer(): PreviewPlayer`, with `play(bytes: Uint8Array): Promise<void>`, `stop(): void`, and `dispose(): Promise<void>`; `useKitInspector()` exposes kit, selectedSlot, loading, error, importFile(file), and selectSlot(number). Browser APIs stay in these adapters. Components receive the shared projections from task 2.

- [ ] Add component-test support compatible with the selected Vue/Vitest versions. Write deferred-promise tests for overlapping imports, failed replacement preserving the previous kit, size-limit rejection before reading, and stop during pending audio decode. Assert old work never changes current state or starts playback.
- [ ] Run the focused lifecycle tests; confirm failures before implementing behavior.
- [ ] Implement import generations, bounds checks, and user-readable errors. Reset the file input after processing so the same file can be retried. Replacing a kit or changing the selected pad stops playback. Dispose nodes and AudioContext at teardown.
- [ ] Implement one-at-a-time user-triggered sample playback with a conservative fixed preview gain and Stop control. Decode a copy of the WAV bytes, preserve originals, and surface decode failure separately from import failure. Handle AudioContext resume rejection.
- [ ] Implement the entry app and four main visual areas: import/header, staggered pad grid, selected sample details, and collapsed raw metadata. Empty pads are selectable for inspection but cannot play. Add loading/error announcements, keyboard-operable buttons, visible focus, and horizontal scrolling for the pad layout on narrow screens.
- [ ] Add component assertions for numeric slot labels, sample names rendered as text, empty pad behavior, unsupported-preview messaging, and provisional parameter labels. Explain preview uses original audio without hardware processing. Display the app's 64 MiB limit.
- [ ] Run focused tests, typecheck, lint, and build. Commit task files.

## Task 4: Optional WebMCP inspection adapter

**Interfaces:** `createInspectionTools(getKit: () => Kit | null)` returns the three read-only tool definitions backed by task 2. Names: `getKitSummary`, `getSlotDetails`, `getValidationFindings`. `registerInspectionTools(host, getKit): () => void` returns cleanup. The browser adapter alone knows the native registration contract; tool handlers return schema-validated bounded results.

- [ ] At implementation time verify the current official WebMCP registration/result contract and available local host API. Isolate host-specific typing in `webMcpAdapter.ts`; do not invent a global polyfill. Reference: https://github.com/webmachinelearning/webmcp and its implementation-status document.
- [ ] Write tests using a fake host: disabled/unsupported means zero registration; enable registers three tools once; disable/unmount unregisters; no kit returns a clear error; slot validation matches the UI API; replacement causes the next call to see the new kit; a retained handler invoked after disable rejects access.
- [ ] Run `npm test -- src/agents`; confirm failures before implementation.
- [ ] Implement the adapter and opt-in AgentAccess control. Explain agents can receive kit metadata and sample paths through tools. Never return sample audio, expose filesystem reads, or enable mutations. Enabling unsupported WebMCP shows an unavailable state without breaking the editor. Registration failure cleans up partially registered tools.
- [ ] Verify tool result size is bounded, no raw buffers are serialized, and filenames remain data rather than instructions. Run focused tests and existing regression tests. Commit task files.

## Task 5: Real-kit integration, browser verification, and handoff

- [ ] Run the TypeScript parser against the local PO20, Rock kit, and LINN Drum inputs without copying them into tracked files. Assert populated counts 9/15/15; Rock slot 6 level 56, pan -53, FX 46; slot 12 level 58, pan 53; slot 9 level 48, pan 6, choke code 1. Hash input files before/after and assert equality.
- [ ] Use browser tooling to verify file picker/drop, pad placement, empty slots, metadata, replacement errors, desktop/narrow layouts, and Play/Stop. Inspect console errors. If audio output cannot be heard, report functional playback checks separately from listening verification.
- [ ] Exercise WebMCP against an actual available supporting host if possible. Report native success only with a real tool call; otherwise state that the adapter passed mock tests and native host integration remains unverified. Do not require WebMCP availability for the base milestone.
- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`. Check IDE problems for changed source when tools are available. Fix relevant failures and rerun affected checks.
- [ ] Update README with setup, supported imports, preview limitations, provisional fields, local processing, opt-in agent metadata disclosure, and deferred export/conversion. Update AGENTS with the shared-core boundaries and confirmed FX-send evidence. Commit only intended files, including the existing task-created AGENTS file if unchanged by the user.
- [ ] Report actual verification outcomes and provide the local app URL. Leave deployment and push for a separate request.

## Execution recommendation

Use native execution in this chat: the tasks share a small set of types and follow a sequential dependency chain. One final independent review can check the completed implementation. Subagent-driven execution is an alternative if the user prefers separate implementer/reviewer passes per task.
