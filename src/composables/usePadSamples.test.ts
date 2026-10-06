import { expect, it, vi } from 'vitest';
import { usePadSamples } from './usePadSamples';
import { encodePcm16 } from '../core/sampleAudio';
const wav=encodePcm16([new Float32Array(48000*3)]);
function file(){return {name:'long.wav',size:wav.length,arrayBuffer:async()=>wav.buffer};}
it('automatically trims to 2.7 and applies to the captured pad',async()=>{
 const apply=vi.fn();const convert=vi.fn(async()=>wav);const state=usePadSamples(apply,convert);
 await state.assign(3,file());expect(convert.mock.calls[0]?.slice(1)).toEqual([0,2.7]);expect(apply.mock.calls[0]?.[0]).toBe(3);expect(state.entries.get(3)?.trimmed).toBe(true);expect(state.busy.value).toBe(false);
});
it('merges distinct pad jobs and cancels cleared or reset conversions',async()=>{
 const apply=vi.fn();let finish!:(bytes:Uint8Array<ArrayBuffer>)=>void;const convert=vi.fn(()=>new Promise<Uint8Array<ArrayBuffer>>(resolve=>{finish=resolve;}));const state=usePadSamples(apply,convert);
 const first=state.assign(1,file());await vi.waitFor(()=>expect(convert).toHaveBeenCalledTimes(1));const second=state.assign(3,file());state.cancel(1);finish(wav);await first;
 await vi.waitFor(()=>expect(convert).toHaveBeenCalledTimes(2));finish(wav);await second;expect(apply.mock.calls.map(call=>call[0])).toEqual([3]);
 const third=state.assign(5,file());await vi.waitFor(()=>expect(convert).toHaveBeenCalledTimes(3));state.clear();finish(wav);await third;expect(apply).toHaveBeenCalledTimes(1);expect(state.entries.size).toBe(0);
});
it('keeps previous pad unchanged on conversion failure and validates trim updates',async()=>{
 const apply=vi.fn();const state=usePadSamples(apply,async()=>{throw new Error('bad conversion');});await state.assign(1,file());expect(apply).not.toHaveBeenCalled();expect(state.entries.get(1)?.error).toContain('bad conversion');
 await state.adjust(1,'','2');expect(state.entries.get(1)?.error).toContain('times');
});
it('retains the normalized sample name when updating trim after rename',async()=>{
 const apply=vi.fn();const state=usePadSamples(apply,async()=>wav);
 await state.assign(1,file());state.rename(1,' Kick.wav ');await state.adjust(1,'0','1');
 expect(apply.mock.calls.at(-1)?.[2]).toBe('Kick.wav');
});
it('rejects oversized WAVs before reading',async()=>{
 const read=vi.fn();const state=usePadSamples(vi.fn());await state.assign(1,{name:'big.wav',size:33*1024*1024,arrayBuffer:read});expect(read).not.toHaveBeenCalled();expect(state.entries.get(1)?.error).toContain('32 MiB');
});
it('preserves trim originals through parameter edits and reconciles changed samples only',async()=>{
 const {createKit,setPadColor,renameSample,clearPad}=await import('../core/kitEditing');const {replaceSample}=await import('../core/replaceSample');const {readStk}=await import('../core/readStk');
 const state=usePadSamples(vi.fn(),async()=>wav);await state.assign(1,file());const previous=readStk(replaceSample(createKit(),1,wav,'long.wav'));const original=state.entries.get(1)!.source;
 const colored=readStk(setPadColor(previous,1,30));state.reconcile(previous,colored);expect(state.entries.get(1)!.source).toBe(original);
 const renamed=readStk(renameSample(colored,1,'New Name'));state.reconcile(colored,renamed);expect(state.entries.get(1)!.name).toBe('New Name.wav');expect(state.entries.get(1)!.source).toBe(original);
 state.reconcile(renamed,readStk(clearPad(renamed,1)));expect(state.entries.has(1)).toBe(false);
});
