import { expect, it } from 'vitest';
import { replaceSample } from './replaceSample';
import { encodePcm16 } from './sampleAudio';
import { readStk } from './readStk';
import { makeKit } from './testFixtures';
it.each([0,2])('replaces one sample and preserves every other chunk with trailer %s', padding => {
  const kit = readStk(makeKit([0,2,5],padding,true)); const original = kit.source.slice(); const wav = encodePcm16([new Float32Array([0,0.5,-0.5])]);
  const next = readStk(replaceSample(kit,3,wav,'../../kick 🥁.wav'));
  expect(next.slots[2]!.sample!.bytes).toEqual(wav); expect(next.slots[2]!.path).toMatch(/^SmplTrek\/Pool\/Audio\//);
  for (const i of [0,5]) { expect(next.slots[i]!.rawRecord).toEqual(kit.slots[i]!.rawRecord); expect(next.slots[i]!.sample).toEqual(kit.slots[i]!.sample); }
  expect(next.slots[2]!.rawRecord.subarray(256)).toEqual(kit.slots[2]!.rawRecord.subarray(256));
  expect(next.header.size).toBe(next.source.length); expect(next.header.count).toBe(4); expect(kit.source).toEqual(original);
});
it('adds to an empty slot with legacy discounted sizes and keeps existing data', () => {
  const bytes = makeKit([0,2],2,true); new DataView(bytes.buffer).setUint32(4,bytes.length-52,true); const kit=readStk(bytes);
  const next=readStk(replaceSample(kit,15,encodePcm16([new Float32Array([0.1])]),'ride.wav'));
  expect(next.header.count).toBe(4); expect(next.header.size).toBe(next.source.length-76); expect(next.slots[14]!.sample).toBeDefined(); expect(next.slots[1]!.sample).toBeUndefined();
  expect(next.slots[0]!.sample).toEqual(kit.slots[0]!.sample);
});
it('refuses invalid slot, unknown size convention and non-device WAV', () => {
  const kit=readStk(makeKit()); const wav=encodePcm16([new Float32Array([0.1])]);
  expect(() => replaceSample(kit,16,wav,'a.wav')).toThrow();
  new DataView(kit.source.buffer).setUint32(4,1,true); expect(() => replaceSample(kit,1,wav,'a.wav')).toThrow(/size/);
  const wrong=wav.slice(); new DataView(wrong.buffer).setUint32(24,44100,true); expect(() => replaceSample(readStk(makeKit()),1,wrong,'a.wav')).toThrow();
});
it.each([23,21,30,25,27,1,15,2,13,3,28,4,9,10,8].map((color,index)=>[index+1,color]))('assigns the photographed default to empty slot %s (color %s)', (slot,color) => {
 const kit=readStk(makeKit([]));const before=kit.source.slice();const wav=encodePcm16([new Float32Array([0.1])]);
 const next=readStk(replaceSample(kit,slot!,wav,'sample.wav'));
 expect(next.slots[slot!-1]!.parameters.colorCode).toBe(color!-1);
 expect(kit.source).toEqual(before);
 const replacement=readStk(replaceSample(next,slot!,wav,'replacement.wav'));
 expect(replacement.slots[slot!-1]!.parameters.colorCode).toBe(color!-1);
});
