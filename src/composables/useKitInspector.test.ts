import { expect, it, vi } from 'vitest';
import { useKitInspector } from './useKitInspector';
import { makeKit } from '../core/testFixtures';
function file(name: string, read: () => Promise<ArrayBuffer>, size = 5000) { return { name, size, arrayBuffer: read }; }
it('retains the latest import when an older read finishes late', async () => {
  const state = useKitInspector(); let finish!: (value: ArrayBuffer) => void;
  const old = state.importFile(file('old.stk', () => new Promise(resolve => { finish = resolve; })));
  await state.importFile(file('new.stk', async () => makeKit([2]).buffer as ArrayBuffer));
  finish(makeKit([0]).buffer as ArrayBuffer); await old;
  expect(state.filename.value).toBe('new.stk'); expect(state.kit.value?.slots[2]?.sample).toBeDefined();
});
it('preserves a loaded kit after invalid replacement and rejects large files before read', async () => {
  const state = useKitInspector(); await state.importFile(file('good.stk', async () => makeKit().buffer as ArrayBuffer));
  await state.importFile(file('bad.stk', async () => new ArrayBuffer(0)));
  expect(state.filename.value).toBe('good.stk'); expect(state.error.value).toBeTruthy();
  const read = vi.fn(); await state.importFile(file('huge.stk', read, 64 * 1024 * 1024 + 1)); expect(read).not.toHaveBeenCalled();
});
it('invalidates pending reads on dispose', async () => {
  const state = useKitInspector(); let finish!: (value: ArrayBuffer) => void;
  const pending = state.importFile(file('a.stk', () => new Promise(resolve => { finish = resolve; })));
  state.dispose(); finish(makeKit().buffer as ArrayBuffer); await pending; expect(state.kit.value).toBeNull();
});
it('stops playback started while a replacement kit is still reading', async () => {
  let playing = false;
  const state = useKitInspector(() => { playing = false; });
  await state.importFile(file('first.stk', async () => makeKit().buffer as ArrayBuffer));
  let finish!: (value: ArrayBuffer) => void;
  const pending = state.importFile(file('next.stk', () => new Promise(resolve => { finish = resolve; })));
  playing = true; // User previews the old kit after the replacement import starts.
  finish(makeKit([2]).buffer as ArrayBuffer); await pending;
  expect(state.filename.value).toBe('next.stk'); expect(playing).toBe(false);
});
it('edits current metadata, exports a copy, and resets to original', async () => {
  const state = useKitInspector(); await state.importFile(file('good.stk', async () => makeKit().buffer as ArrayBuffer));
  state.editSlot(6, { level: 80, pan: 0 });
  expect(state.kit.value!.slots[5]!.parameters.level).toBe(80); expect(state.dirty.value).toBe(true);
  state.resetEdits(); expect(state.kit.value!.slots[5]!.parameters.level).toBe(56); expect(state.dirty.value).toBe(false);
});
it('blocks edits during replacement and preserves changes after failed import', async () => {
  const state = useKitInspector(); await state.importFile(file('good.stk', async () => makeKit().buffer as ArrayBuffer)); state.editSlot(1, { level: 80 });
  let finish!: (value: ArrayBuffer) => void;
  const pending = state.importFile(file('bad.stk', () => new Promise(resolve => { finish = resolve; })));
  expect(() => state.editSlot(1, { level: 70 })).toThrow(/reading/i);
  finish(new ArrayBuffer(0)); await pending;
  expect(state.dirty.value).toBe(true); expect(state.kit.value!.slots[0]!.parameters.level).toBe(80);
  await state.importFile(file('new.stk', async () => makeKit([2]).buffer as ArrayBuffer)); expect(state.dirty.value).toBe(false);
});
it('returns to clean state when edits restore original values', async () => {
  const state = useKitInspector(); await state.importFile(file('good.stk', async () => makeKit().buffer as ArrayBuffer));
  state.editSlot(1, { level: 80 }); state.editSlot(1, { level: 56 }); expect(state.dirty.value).toBe(false);
});
