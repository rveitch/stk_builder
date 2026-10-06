import { expect, it } from 'vitest';
import { decodeWav, encodePcm16, trimAudio } from './sampleAudio';
import { makeWav } from './testFixtures';
import { readWav } from './readWav';
it('encodes independent expected PCM16 bytes with clipping and stereo interleave', () => {
  const bytes = encodePcm16([new Float32Array([-2, 0, 1]), new Float32Array([0.5, -0.5, 0])]);
  expect(readWav(bytes)).toMatchObject({ channels: 2, sampleRate: 48000, bitDepth: 16 });
  const view = new DataView(bytes.buffer); expect([0,2,4,6,8,10].map(n => view.getInt16(44+n,true))).toEqual([-32768,16384,0,-16384,32767,0]);
  const decoded = decodeWav(bytes); expect(decoded.channels[0]![0]).toBe(-1); expect(decoded.channels[1]![0]).toBe(0.5);
});
it.each([8,16,24,32])('decodes known PCM full negative scale at %s bits', bitDepth => {
  const bytes = new Uint8Array(44 + bitDepth / 8); bytes.set(makeWav().subarray(0,44)); const view = new DataView(bytes.buffer);
  view.setUint32(4,bytes.length-8,true); view.setUint16(34,bitDepth,true); view.setUint16(32,bitDepth/8,true); view.setUint32(28,48000*bitDepth/8,true); view.setUint32(40,bitDepth/8,true);
  if (bitDepth > 8) bytes[bytes.length-1]=128;
  // Odd PCM data lengths require RIFF padding.
  const padded = bytes.length % 2 ? new Uint8Array(bytes.length+1) : bytes; if (padded !== bytes) { padded.set(bytes); new DataView(padded.buffer).setUint32(4,padded.length-8,true); }
  expect(decodeWav(padded).channels[0]![0]).toBe(-1);
});
it('decodes float32 and rejects nonfinite samples', () => {
  const bytes = makeWav(false,3); const view = new DataView(bytes.buffer); view.setUint16(34,32,true); view.setUint16(32,4,true); view.setUint32(28,192000,true); view.setFloat32(44,0.25,true);
  expect(decodeWav(bytes).channels[0]![0]).toBe(0.25);
  view.setFloat32(44,NaN,true); expect(() => decodeWav(bytes)).toThrow(/finite/);
});
it('requires explicit valid trims and preserves selected source frames', () => {
  const source = { sampleRate: 48000, channels: [new Float32Array(48000*6)] }; source.channels[0]![48000]=0.5;
  expect(() => trimAudio(source,0,6)).toThrow(/5.4/);
  expect(trimAudio(source,1,2).channels[0]![0]).toBe(0.5);
  for (const [start,end] of [[NaN,1],[-1,1],[1,1],[2,1],[0,7]]) expect(() => trimAudio(source,start!,end!)).toThrow();
});
it('refuses unsupported WAV encoding and invalid output', () => {
  expect(() => decodeWav(makeWav(false,99))).toThrow(/encoding/);
  expect(() => encodePcm16([new Float32Array([NaN])])).toThrow();
  expect(() => encodePcm16([new Float32Array(259201)])).toThrow();
});
