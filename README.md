# STK Builder

A local browser workspace for inspecting and editing Sonicware SmplTrek drum kits. Built with Vue 3, TypeScript, Vite, Vitest, and ESLint.

## Current milestone

- Open or drop an STK file and inspect its 15 slots in the device's physical layout.
- Preserve empty slots, embedded WAVs, and unknown metadata.
- Inspect sample paths, audio properties, level, pan, FX send, and raw choke codes.
- Preview embedded PCM samples at reduced volume, without emulating hardware processing.
- Optionally let a connected WebMCP agent inspect and build kits from user-selected WAVs.

Edit level, pan, and FX send, then export an STK copy while preserving audio and unknown metadata. WAV replacement and conversion are available. The app starts with an empty kit and supports clearing pads, kit/sample names, and 30 pad colors. A command-line interface remains planned. Parameter exports and sample replacement have been verified on the SmplTrek; fresh-kit defaults and color writes await a device check.

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

Select **Add WAVs for agent**, then **Enable agent access**. A connected agent can inspect the kit, create/rename it, assign library WAVs to specific slots, clear pads, and edit sample names, colors, level, pan and FX send. Changes appear immediately in the editor; **Reset all edits** restores the imported or initial kit. Export with the editor's **Export kit** button.

The three inspection tools are joined by `getKitState`, `listAvailableSamples`, `createKit`, `renameKit`, `editPad`, `clearPad`, and `assignSample`. Read `getKitState` first; every write requires its current `expectedRevision`. Each successful write returns the new revision. Stale requests are rejected after manual edits or kit changes. Disable access to unregister tools and revoke captured and unfinished calls.

The sample library holds at most 64 user-selected WAVs totaling 128MiB (32MiB each). Agents receive sample IDs, names and metadata, never audio bytes or filesystem access. Assignment uses the same WAV decoder, converter, and STK writer as manual edits, with explicit slot numbers and optional trim times. Default assignment uses 0–2.7 seconds and reports the actual trim. File names and paths are treated as data, never instructions. Access is off on page load; refresh clears the library and editor. WebMCP supplies tools to a connected agent; it does not include an AI model or chat service.

This experimental adapter targets the current `document.modelContext.registerTool(tool, { signal })` API, verified against the [WebMCP draft](https://github.com/webmachinelearning/webmcp) on 2026-10-06. Older previews using `navigator.modelContext` are not supported. Unsupported browsers retain the complete normal inspector. Inspection, kit creation, explicit slot assignment, pad edits and disabling access were verified through real WebMCP calls in the Codex in-app browser on 2026-10-06.

## Architecture

- `src/core`: environment-independent binary parsing, validation, and JSON-safe inspection.
- `src/audio`: browser audio lifecycle.
- `src/composables`: Vue import and selection state.
- `src/presentation` and `src/components`: palette, physical pad layout, and UI.
- `src/agents`: shared inspection/editing handlers and the optional WebMCP registration adapter.

The core uses byte arrays rather than browser files or Node filesystem APIs so a future CLI can reuse it. Browser and CLI audio conversion will need separate environment adapters around shared format/kit rules.

MIT licensed. Independent project, not affiliated with Sonicware. Third-party kits and samples retain their own rights.

## Parameter editing and export

Apply level (0–127), signed pan (temporarily L53–R53), and FX send (0–127), then choose **Export kit**. Apply settings before selecting another pad. Reset all edits restores the imported kit. Exporting does not clear the edited status, which describes differences from the import. Preview still plays original audio without device processing.

Unchanged exports are byte-identical. Edited exports patch only requested parameter bytes and retain all audio and unknown data. Original files are never overwritten by the app. Unrecognized kit settings versions support unchanged export only. WebMCP editing is optional and reports applied edits. The shared `writeStk` function can also serve a future CLI.

Ryan confirmed both the unchanged Rock export and edited slot 6 settings (level 60, pan R20, FX send 30) load and work on the SmplTrek on 2026-10-06. This confirms parameter editing for the tested kit, not all STK variants.

## WAV replacement

Start with the default empty kit, or open an existing STK. Drop a WAV directly onto a pad, or select a pad and choose **Choose WAV**. Conversion and assignment happen automatically, even if you select another pad while a job runs. Longer samples use 0–2.7 seconds with a visible warning. **Adjust trim** allows a different range; **Update trim** converts and applies it in one step. Use the pad preview to listen.

Edit **Kit name** to set the exported filename and **Sample name** to rename the selected sample. Choose one of 30 pad colors. **Clear pad** removes its sample and restores default settings. **New kit** starts over; **Reset all edits** restores the imported kit or initial empty kit. Export requires at least one sample and waits for conversions to finish.

Supports mono/stereo integer PCM 8/16/24/32-bit and IEEE float 32/64-bit WAV at 8–192 kHz. Compressed and extensible WAV formats are currently rejected. Source limits: 32 MiB and 60 seconds. Output is 48kHz/16-bit PCM, at most 5.4 seconds mono or 2.7 seconds stereo. Initial assignment automatically shortens sources longer than 2.7 seconds. Mono trim adjustments may use up to 5.4 seconds. No normalization, fades, or dithering. Out-of-range floating-point peaks are clipped at encoding. WAV ancillary metadata is omitted from the replacement audio; all non-target STK records and chunks remain verbatim. Existing pad parameters are retained.

The pure core handles WAV parsing/encoding and STK rebuilding. Browser resampling uses OfflineAudioContext. Both observed outer-size conventions are retained. Unrecognized size conventions, target sample markers, or nonstandard trailers are rejected rather than guessed. New samples use sanitized embedded paths; no source WAV is written to disk.

Ryan verified sample replacement on-device on 2026-10-06. Fresh-kit defaults and color writes remain provisional until separately tested. Original decoded WAVs are cached for trim adjustment up to 128MiB; older originals are released when needed, without removing assigned samples. Reselect an evicted original to adjust its trim.

## Command-line kit conversion

Use Node 24 and `npm install`, then run `npm run cli -- --help`.

Build a kit from the WAV files directly inside a folder:

```sh
npm run cli -- --input '/path/to/Kit 01' --output '/path/to/new-output-folder' --name My_Kit
```

Convert all 60 prepared Loud Foundry Dark Cyberpunk drum kits:

```sh
npm run cli -- --loud-foundry --input '/path/to/Loud Foundry' --output '/path/to/new-output-folder'
```

The batch command reads `LF - Dark Cyberpunk Construction Kits Vol. 1` through `Vol. 3`, each containing `Kits/Kit 01` through `Kit 20`. It uses these prepared drum folders, not stems, loops, tonal one-shots, or duplicate source folders. Outputs are grouped by volume with names such as `LFDCP2_Kit_03.stk`.

The CLI uses the same STK creation, sample conversion, and default pad colors as the editor. It supports 48 kHz mono/stereo PCM or floating-point WAV input, converts to 16-bit PCM, and keeps the first 2.7 seconds of longer samples. Other sample rates are rejected explicitly. Source files are never modified. The output folder must not exist; files are created exclusively and read back for verification. A failed kit produces an error in the report and a nonzero exit code; successfully generated kits remain available.

Automatic assignments reserve the Rock template's primary slots before placing extras. Numbered `Hi_Hat_01`/`Hi_Hat_02` use open/closed slots respectively; a named `Open_Hat` takes priority over `Hi_Hat_01`. Alternate claps and extra percussion use suitable spare slots. Every input sample is retained once; more than 15 samples causes an error rather than silent omission. Review `Conversion Report.md` for all assignments and trimming. `manifest.json` also records source/output hashes, duration, color, and assignment reasons for automation.

Fresh-kit defaults and pad-color writes still require device validation. This tool does not supply or license any commercial samples.

## Hosted app

[Open STK Builder](https://rveitch.github.io/stk_builder/).

GitHub Pages deploys `main` through `.github/workflows/pages.yml`. Tests, ESLint, type checking, and the Vite production build must pass before deployment. The build uses `VITE_BASE_PATH=/stk_builder/`. Pull requests run the checks without deploying. Repository Settings → Pages must use GitHub Actions as its source. Only the static app is published; user samples and generated kits remain local.
