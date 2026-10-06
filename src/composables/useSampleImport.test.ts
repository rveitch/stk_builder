import { expect, it, vi } from 'vitest';
import { useSampleImport } from './useSampleImport';
import { encodePcm16 } from '../core/sampleAudio';
function file(name: string, read: () => Promise<ArrayBuffer>, size = 100) { return { name,size,arrayBuffer:read }; }
const wav = encodePcm16([new Float32Array([0.1,0.2])]);
it('discards late source reads and conversion after cancellation', async () => {
  let finishRead!: (buffer:ArrayBuffer)=>void; let finishConversion!: (bytes:Uint8Array<ArrayBuffer>)=>void;
  const state = useSampleImport(() => new Promise(resolve => { finishConversion=resolve; }));
  const old = state.load(file('old.wav',() => new Promise(resolve => { finishRead=resolve; })));
  await state.load(file('new.wav',async () => wav.buffer)); finishRead(wav.buffer); await old; expect(state.name.value).toBe('new.wav');
  const preparing=state.prepare(); state.clear(); finishConversion(wav); await preparing;
  expect(state.prepared.value).toBeNull(); expect(state.busy.value).toBe(false);
});
it('invalidates converted preview when trim changes and blocks blank times', async () => {
  const convert = vi.fn(async () => wav); const state=useSampleImport(convert);
  await state.load(file('a.wav',async () => wav.buffer)); await state.prepare(); expect(state.prepared.value).toEqual(wav);
  state.start.value=''; expect(state.prepared.value).toBeNull(); await state.prepare(); expect(state.error.value).toBeTruthy(); expect(convert).toHaveBeenCalledTimes(1);
});
it('rejects size before reading and corrupt audio without changing a kit', async () => {
  const state=useSampleImport(); const read=vi.fn(); await state.load(file('huge.wav',read,33*1024*1024)); expect(read).not.toHaveBeenCalled(); expect(state.error.value).toContain('32');
  await state.load(file('bad.wav',async()=>new ArrayBuffer(1))); expect(state.source.value).toBeNull(); expect(state.error.value).toBeTruthy();
});
