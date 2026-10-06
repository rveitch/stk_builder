# WAV slot replacement

Approved extension: import a WAV into an existing kit's specific pad, convert to 48kHz 16-bit PCM, explicitly trim long audio, preview then apply/export. Existing parameter roundtrip/edit is hardware-verified by Ryan. Sample writing awaits a new device check.

Architecture: pure WAV decode/encode and STK sample replacement in core; browser OfflineAudioContext resampling adapter; cancellable staging composable and Vue replacement panel. No automatic truncation, normalization, agent mutation, or source file writes.

Constraints: mono/stereo integer PCM8/16/24/32 and float32/64 WAV; 8–192kHz; 32MiB/60s source cap. Output at most5.4s mono/2.7s stereo. Unsupported encodings report errors. Trim times in seconds rounded to source frames, validated before allocation. Preserve non-target records/chunks verbatim. Preserve known physical-size or discounted-size header convention; refuse unknown size conventions and unknown target markers/trailers. New empty-slot chunks use marker1 and no trailer. Paths sanitized ASCII with bounded basename. Existing slot parameters retained.

Review focus: all 14 other samples and metadata preserved; correct outer sizes/counts for sparse and padded kits; numeric/nonfinite/oversize decode rejection; explicit trim and preview invalidation; stale reads/conversions cannot alter a different slot/kit; reset/dirty covers audio-only changes.

## Tasks
1. Test first: pure WAV decode/encode, interval validation and sample rebuild including empty slots and both header styles. Implement and run tests.
2. Test first: staging lifecycle, browser resampling boundary, UI source/trim/prepare/preview/apply and pad drop. Wire shared state and dirty/reset. Run full tests/checks.
3. Compare real-kit untouched bytes; browser verify44.1kHz conversion and trim, download; create device test artifact. Independent review, fixes and final checks. Commit locally and hand off for hardware check.

Evidence: Sonicware manual https://www.sonicware.co.jp/DL/SmplTrek/DOC/SmplTrek_manual_en_r3.pdf recommends48kHz/16bit; Web Audio https://webaudio.github.io/web-audio-api/ specifies offline rendering and source rate conversion.

## Completion record

- Implemented WAV decode/encode, immutable target-slot rebuild, browser conversion, explicit trim/preview/apply UI, pad drops, staging cancellation, audio-aware dirty/reset, and parameter hardware-verification status.
- 92 tests pass; typecheck, ESLint, production build, diff checks, and focused IDE checks pass.
- Independent GPT-6 Astra review found no additional actionable correctness issues. A separately identified Node Buffer ownership issue was reproduced with a failing test and fixed using an explicit Uint8Array copy.
- PO20, Rock, and LINN replacements retain every non-target record/sample; original files unchanged; outer-size deltas remain -234/-360/0 respectively.
- In-app browser exercised six-second44.1kHz float import, rejection without trim, one-second conversion, preview/stop, apply and correct48kHz16-bit metadata. Desktop replacement layout inspected. Download did not materialize on disk; do not claim end-to-end download validation for this run.
- Chrome fallback could not select files because extension file-URL permission is disabled. No permissions changed. Device artifact generated through shared writer instead.
- Device artifact: `/Users/ryanveitch/Documents/SmplTrek/STK Builder Device Tests/Rock-sample-test.stk`. Slot6 replaced by a one-second440Hz decaying tone; settings retained56/L53/46 and all14 other pads byte-identical.
- Ruling: preserve observed header conventions and reject unfamiliar ones rather than guessing; cost is some otherwise-valid kits may remain inspection-only for sample replacement.
- Ruling: source formats limited to common mono/stereo PCM and float WAV,32MiB/60s; compressed/extensible formats require external conversion for now.
- No deferred review findings. Hardware verification of sample playback is the remaining user checkpoint.
