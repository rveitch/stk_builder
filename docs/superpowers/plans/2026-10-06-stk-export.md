# Lossless STK export and parameter editing

Goal: implement the approved next step through a concrete device validation checkpoint.
Architecture: immutable byte patching in the shared core, reparsing edits for consistent Vue and read-only WebMCP state. Preserve original kit for reset. Browser download adapter owns Blob URLs.
Design: unchanged export is byte-identical. Only level, signed pan, and FX send are editable. Show applied edits, reset to import, and export to a separate filename. All other fields/audio remain unchanged. No conversion or agent mutations before device validation.
Constraints: current checkout, Node24, named functions, Vue/TypeScript/Vitest/ESLint. Pan editing temporarily limited to observed -53..53, level/FX 0..127. Unknown KTDT markers/extensions are passthrough-only. Originals never modified.
Review focus: unintended byte changes, invalid numeric input, stale editor values, concurrent replacement, export filename and URL lifetime.

## Task 1: writer
- [x] Tests: unchanged copy for sparse/ancillary/padded kits, exact changed offsets, invalid slots/fields/numbers rejected, unsupported settings marker edit rejection.
- [x] Watch failure, implement writeStk(kit, edits), run suite.
## Task 2: editing and download
- [x] Tests: edit/reset/import lifecycles and form validation, download bytes/naming/lifecycle.
- [x] Implement reusable composable edits, parameter form and export controls; disable edits while loading and protect unsaved edits on replacement/navigation.
- [x] Run tests, lint, typecheck, build and IDE checks.
## Task 3: evidence and handoff
- [x] Verify all three real kits roundtrip exactly; generate Rock roundtrip and three-byte edited copies outside repository.
- [x] Browser verify edits/reset/download; review and fix meaningful issues.
- [x] Commit local work and provide device files with expected settings. Device validation gates sample replacement/conversion.

## Verification outcome

71 tests pass. Typecheck, ESLint, production build, diff checks, and focused IDE error checks pass. Independent GPT-6 Astra review found no actionable correctness issues. PO20/Rock/LINN Drum unchanged exports match every source byte. Browser-downloaded Rock edit matches the independently generated expected three-byte edit. Reset restores original metadata. Original inputs remain unchanged.

Decision: pan remains restricted to observed -53..53 rather than claiming unverified hardware limits. This temporarily excludes potentially valid wider positions. Explicit Apply settings separates draft input from exported values; the UI instructs users to apply before switching pads/exporting. Download-event automation timed out, but the resulting file was verified directly on disk.

Device copies and instructions: /Users/ryanveitch/Documents/SmplTrek/STK Builder Device Tests. Hardware compatibility is pending user validation; conversion/new-kit creation is gated on that result.
