import { expect, it } from 'vitest';
import { readWav } from './readWav';
import { makeWav } from './testFixtures';
it.each([false, true])('reads PCM with ancillary chunks %s', ancillary => {
  expect(readWav(makeWav(ancillary))).toMatchObject({ channels: 1, sampleRate: 48000, bitDepth: 16, durationSeconds: 2 / 48000, previewSupported: true });
});
it('retains unknown encodings without claiming PCM duration or preview', () => {
  expect(readWav(makeWav(false, 99))).toMatchObject({ format: 99, previewSupported: false, durationSeconds: null });
});
it.each([4, 16, 40])('rejects declared subchunk overruns at %i', offset => {
  const bytes = makeWav(); new DataView(bytes.buffer).setUint32(offset, 0xffffffff, true);
  expect(() => readWav(bytes)).toThrow();
});
it('rejects missing fmt and missing data', () => {
  for (const offset of [12, 36]) {
    const bytes = makeWav(); bytes.set(new TextEncoder().encode('JUNK'), offset);
    expect(() => readWav(bytes)).toThrow();
  }
});
it('rejects excessive zero-length ancillary chunks', () => {
  const original = makeWav(); const bytes = new Uint8Array(original.length + 5000 * 8); bytes.set(original);
  const view = new DataView(bytes.buffer); view.setUint32(4, bytes.length - 8, true);
  for (let offset = original.length; offset < bytes.length; offset += 8) bytes.set(new TextEncoder().encode('JUNK'), offset);
  expect(() => readWav(bytes)).toThrow(/chunk limit/i);
});
