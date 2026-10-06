# STK Builder: import and inspection

## Purpose and approved direction

Make SmplTrek kit preparation easier through a local browser app. The first milestone imports an existing STK, presents its samples in the physical pad layout, and lets the user inspect and audition them. Kit editing, generation, export, and WAV conversion follow after this foundation is verified.

Use Vue 3 Composition API, TypeScript, Vite, Vitest, and ESLint, following the local rnd-synth-midi-control configuration conventions. Node 24 is already specified. Work in the existing stk_builder checkout. Use an independent implementation under the repository license, not a translation of the LGPL community writer.

## User experience

- Open an STK with a file picker or drag and drop. Files remain in browser memory and are not uploaded.
- Show the filename, populated-slot count, and sample summary after a successful import.
- Render seven staggered upper pads (2, 4, 6, 8, 10, 12, 14) and eight lower pads (1, 3, 5, 7, 9, 11, 13, 15). Keep that ordering on narrow screens using horizontal scrolling if necessary.
- Display slot numbers, sample names, and approximate pad colors. Empty slots remain visibly empty. Rock instrument conventions do not override imported assignments.
- Selecting a pad reveals its details. A separate Play/Stop control auditions the original embedded sample at a conservative preview volume. This milestone does not emulate device effects or its level/pan response.
- Details include original sample path, duration, channels, sample rate, bit depth, level, pan, and FX send. Choke values are shown as stored group codes until OFF versus group 0 is resolved.
- Pitch and color interpretations carry a concise unverified label. Slope, reverse, kit level, and LoFi remain undecoded rather than receiving invented defaults. Raw metadata is available in a collapsed inspection section.
- Palette swatches approximate the two supplied photos and display device color numbers. Stored color + 1 is a provisional interpretation, not a validated export rule.
- A bad import displays a useful error and retains the previously loaded kit. Importing another kit stops existing playback. No autoplay.

## Structure and data contracts

- `src/stk`: pure binary parsing and typed kit/slot/sample records, independent of Vue and browser audio.
- `src/audio`: preview decoding and playback lifecycle; errors do not invalidate a successfully parsed kit.
- `src/composables`: import state, selected slot, loading/error state, and preview coordination.
- `src/components`: import area, pad layout, and detail panel.
- `src/styles.css`: responsive layout and shared visual tokens. Use plain CSS without introducing a component framework for this milestone.

The parsed model always includes 15 slots, indexed internally from 0 through 14. Preserve the full source buffer, raw records, chunk boundaries, embedded WAV slices, trailing bytes, and any unrecognized data. Do not reconstruct a file in this milestone. Samples are associated using their ISDT slot index, not their order in the file.

## Parser behavior and confidence

Validate VDK0, bounds, chunk sizes, record availability, ISDT slot indices, duplicate slot assignments, and embedded RIFF/WAVE boundaries before exposing a kit. Reject truncated or structurally inconsistent inputs with context. Unknown well-bounded chunks can be retained and reported without interpreting them. Never scan raw audio for chunk signatures as the primary parser strategy.

Observed KTDT starts at byte 16; its size is 4228 including its 16-byte header. Slot records begin at byte 32. Each has a 256-byte path and 24 parameter bytes. Parse WAV subchunks by declared lengths and RIFF word alignment, accepting ancillary chunks. Rock and PO20 differ in WAV metadata and ISDT trailing bytes; support both based on declared boundaries.

Device-correlated record offsets: level 0x100, signed pan 0x101, FX send 0x110, choke code 0x111. Signed pitch at 0x104 and color at 0x112 remain provisional. Level range is 0-127 with default 100. The choke manual lists OFF plus 0-6, so do not conflate stored zero with a proven UI choice.

Treat the outer size field as observed metadata rather than an authoritative file boundary: LINN's field equals physical size, while Rock and PO20 use a different observed calculation. Respect actual buffer bounds and chunk sizes. Report unfamiliar versions and unsupported WAV encodings; retain inspectable metadata even when preview is unsupported.

Reject files above a documented 64 MiB initial import limit before reading them into memory. This is an app limit, not a claimed device limit. Guard asynchronous imports and playback so older operations cannot replace newer selections. Release audio nodes and buffers when replacing the kit or unmounting.

## Validation and acceptance

Use synthetic, generated audio fixtures in committed tests. Do not commit factory samples, user kits, photos, or manuals. Use the supplied local Rock, PO20, and LINN kits for additional read-only integration checks.

- Rock and LINN import with 15 populated slots; PO20 imports with nine and preserves gaps.
- Rock slot 6 shows Tom1, level 56, pan L53, FX send 46. Slot 12 shows Tom4, level 58, pan R53. Slot 9 shows open hi-hat, level 48, pan R6, choke code 1.
- Test padding variants, ancillary WAV chunks, signed values, out-of-range and duplicate indices, truncated data, and malformed lengths.
- Verify source bytes remain unchanged and raw metadata is retained.
- Test import replacement/error behavior and preview lifecycle. Manually verify file selection, drag/drop, pad order, narrow layout, and user-triggered playback in the browser.
- Run Vitest in non-watch mode, type checking, lint, production build, and diff checks. Inspect changed-code IDE diagnostics when available.

## Deferred milestones

Next: parameter editing and verified STK export, followed by WAV assignment/conversion and kit creation. Device load testing is required before claiming generated kits are compatible. KIT SEND FX audition settings are not saved by the device (reference manual page 108); any future browser effects remain separate from exported kit settings. The manual's playback limits are 5.4 seconds mono and 2.7 seconds stereo.

Deployment, repository publication changes, a durable library, and exact device DSP emulation are outside this milestone.
