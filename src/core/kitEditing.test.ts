import { expect, it } from 'vitest';
import { createKit, clearPad, renameSample, setPadColor } from './kitEditing';
import { readStk } from './readStk';
import { replaceSample } from './replaceSample';
import { makeKit, makeWav } from './testFixtures';
it('creates 15 empty default pads and observed kit defaults without bundled audio', () => {
 const kit=createKit(); expect(kit.source.length).toBe(4244);expect(kit.header).toEqual({size:4244,count:1});expect(kit.diagnostics).toEqual([]);
 expect(kit.source[4240]).toBe(100);
 for(const slot of kit.slots){expect(slot.sample).toBeUndefined();expect(slot.path).toBe('');expect([...slot.rawRecord.subarray(256)]).toEqual([100,0,0,127,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);}
});
it.each([false,true])('clears padded audio and resets parameters, preserving other slots, legacy=%s', legacy=>{
 const bytes=makeKit([0,2],2,true);if(legacy)new DataView(bytes.buffer).setUint32(4,bytes.length-52,true);const kit=readStk(bytes);
 const next=readStk(clearPad(kit,1));expect(next.slots[0]!.sample).toBeUndefined();expect(next.slots[0]!.rawRecord).toEqual(createKit().slots[0]!.rawRecord);expect(next.slots[2]!.sample).toEqual(kit.slots[2]!.sample);
 expect(next.header.count).toBe(2);expect(next.header.size).toBe(next.source.length-(legacy?26:0));
 const again=readStk(replaceSample(next,1,makeWav(),'new.wav'));expect(again.header.count).toBe(3);
});
it('changes only path or color bytes and validates public slot/color/name inputs',()=>{
 const kit=readStk(makeKit());const renamed=readStk(renameSample(kit,1,'My Kick'));
 expect(renamed.slots[0]!.path).toBe('SmplTrek/Pool/Audio/My Kick.wav');expect(renamed.slots[0]!.sample).toEqual(kit.slots[0]!.sample);
 const colored=setPadColor(kit,1,30);expect([...colored.keys()].filter(i=>colored[i]!==kit.source[i])).toEqual([306]);expect(colored[306]).toBe(29);
 for(const color of [0,31,1.5,NaN])expect(()=>setPadColor(kit,1,color)).toThrow();
 expect(()=>clearPad(kit,16)).toThrow();expect(()=>renameSample(kit,2,'Empty')).toThrow();expect(()=>renameSample(kit,1,'')).toThrow();expect(()=>renameSample(kit,1,'../name')).toThrow();
});
