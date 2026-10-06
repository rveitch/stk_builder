# Direct kit building

User approved: default new kit; direct WAV drop automatically converts/applies; sources longer than2.7s use0–2.7s with warning and Adjust trim; new-kit action, clear-pad defaults, kit/sample names and30-color picker.

Implementation: pure core creates minimal observed VDK0/KTDT defaults, clears target ISDT preserving size convention, renames path and changes color byte274. Kit name is export filename, not invented embedded metadata. Empty kits cannot export until a sample is assigned (device refuses sampleless kits). Color mapping remains provisional index+1.

Automatic import queue targets captured pad numbers, cancels stale jobs on clear/new/load/reset, and merges into latest kit. Cache original decoded WAVs for trim adjustment with128MiB bounded retention; evicted originals require reselection. Export disabled while jobs are pending. Existing pad settings survive replacement. No preparation/apply step for initial assignment. Trim edits use one Update trim button.

Tasks: (1) failing core tests then implement create/clear/rename/color; (2) tests for initial newkit/dirty/name/reset and per-pad async assignment; (3) integrate UI, tests and browser smoke; (4) reviewer, checks, hardware artifacts and local commit.
Review focus: header sizes on clear/readd; default record bytes; stale queued conversions after new/reset/clear; merging drops into different pads; retention limits; sanitized names vs displayed names; provisional colors. User's new auto-trim instruction supersedes prior no-auto-trim rule.

Completed: core operations, automatic assignment queue, UI and documentation. Replaced the retired staging composable. Both review findings fixed with regression tests observed failing then passing: trim controls stay available after validation errors; cached names use the same normalization as embedded paths. Final checks:102 tests pass, typecheck/lint/build/diff check pass. PhpStorm reports no App.vue errors; batch inspection was incomplete.

Browser smoke: six-second44.1kHz float WAV automatically becomes2.7-second48kHz16-bit mono; name edits and color selection work; clearing removes sample and restores level100/pan0/send0/color1. Generated and reimported Builder Test.stk with slot1 Low Tone/color1, slot3 High Tone/color30, all others empty (slot6 populated then cleared). Fresh-kit and color device checks remain pending. No plan deviations or deferred review findings.
