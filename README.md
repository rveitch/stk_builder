# STK Builder

A local browser workspace for inspecting and editing Sonicware SmplTrek drum kits. Built with Vue 3, TypeScript, Vite, Vitest, and ESLint.

## Current milestone

- Open or drop an STK file and inspect its 15 slots in the device's physical layout.
- Preserve empty slots, embedded WAVs, and unknown metadata.
- Inspect sample paths, audio properties, level, pan, FX send, and raw choke codes.
- Preview embedded PCM samples at reduced volume, without emulating hardware processing.
- Optionally expose three read-only WebMCP tools to a connected agent.

Edit level, pan, and FX send, then export an STK copy while preserving audio and unknown metadata. Sample conversion, new-kit creation, and a command-line interface remain planned. Device validation of edited exports is pending.

## Development

Use Node 24 (`.nvmrc`) and npm:

```sh
npm ci
npm run dev
```

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Tests use generated synthetic audio. Factory samples, user kits, and reference photos are not bundled. Local integration checks have passed with PO20, factory Rock kit, and LINN Drum; this does not establish support for every STK variant.

## Privacy and file limits

Files are processed in browser memory, without uploads or persistent storage. The initial app import limit is 64 MiB, with at most 4,096 chunks per STK or embedded WAV. These are application resource limits, not device format limits. The UI shows up to 100 import notes and chunk entries. Reloading the page clears the kit. No remote fonts, analytics, or audio services are used.

## Format confidence

Level (0-127, default 100), signed pan, FX send, and choke group location have device-correlated evidence. The displayed choke code is raw because OFF versus group 0 encoding is unresolved. Pitch in cents and stored color index plus one remain provisional. Palette swatches approximate photographed LEDs, not calibrated device RGB values.

Slope, reverse, kit level, and LoFi are retained as undecoded bytes. Unknown chunks and WAV metadata are preserved. WAV previews currently support mono/stereo integer PCM at 8/16/24/32 bits, subject to browser decoding support. Unsupported encodings remain inspectable.

The device manual limits sample playback to 5.4 seconds mono or 2.7 seconds stereo; the inspector reports longer samples. Browser preview plays the original complete sample. KIT SEND FX audition settings are not saved with device kits and are outside this milestone.

## Optional WebMCP

Enable agent access in the app to register `getKitSummary`, `getSlotDetails` (slot 1-15), and `getValidationFindings`. Tools use the same core as the UI and see the current imported kit. They share metadata, including embedded sample paths, with the connected agent. They return no audio and cannot change the kit or access other files. Disabling access unregisters tools and revokes existing handlers. Access is off on each page load.

This experimental adapter targets the current `document.modelContext.registerTool(tool, { signal })` API, verified against the [WebMCP draft](https://github.com/webmachinelearning/webmcp) on 2026-10-06. Older previews using `navigator.modelContext` are not supported. Unsupported browsers retain the complete normal inspector. Actual read-only tool calls were verified in the Codex in-app browser.

## Architecture

- `src/core`: environment-independent binary parsing, validation, and JSON-safe inspection.
- `src/audio`: browser audio lifecycle.
- `src/composables`: Vue import and selection state.
- `src/presentation` and `src/components`: palette, physical pad layout, and UI.
- `src/agents`: shared read-only handlers and the optional WebMCP registration adapter.

The core uses byte arrays rather than browser files or Node filesystem APIs so a future CLI can reuse it. Browser and CLI audio conversion will need separate environment adapters around shared format/kit rules.

MIT licensed. Independent project, not affiliated with Sonicware. Third-party kits and samples retain their own rights.

## Parameter editing and export

Apply level (0–127), signed pan (temporarily L53–R53), and FX send (0–127), then choose **Export STK copy**. Apply settings before selecting another pad. Reset all edits restores the imported kit. Exporting does not clear the edited status, which describes differences from the import. Preview still plays original audio without device processing.

Unchanged exports are byte-identical. Edited exports patch only requested parameter bytes and retain all audio and unknown data. Original files are never overwritten by the app. Unrecognized kit settings versions support unchanged export only. WebMCP remains read-only and reports applied edits. The shared `writeStk` function can also serve a future CLI.

Device validation is pending. Prepared Rock test copies are outside the repository: the edited test changes slot 6 to level 60, pan R20, and FX send 30. Sample replacement, WAV conversion, and new-kit creation will follow successful device validation.
