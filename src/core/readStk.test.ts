import { describe, expect, it } from 'vitest';
import { readStk } from './readStk';
import { makeKit } from './testFixtures';

describe('STK input boundaries and slot assignment', () => {
  it.each([0, 2])('preserves sparse slots and source with %i trailing bytes', padding => {
    const bytes = makeKit([11, 0, 2, 4, 5, 6, 7, 8, 9], padding, true);
    const original = bytes.slice(); const kit = readStk(bytes);
    expect(kit.slots).toHaveLength(15);
    expect(kit.slots.filter(s => s.sample).map(s => s.index)).toEqual([0, 2, 4, 5, 6, 7, 8, 9, 11]);
    expect(kit.slots[5]?.parameters).toMatchObject({ level: 56, pan: -53, fxSend: 46, pitchCents: -200 });
    expect(kit.slots[5]?.sample?.trailingBytes.length).toBe(padding);
    expect(kit.slots[1]?.sample).toBeUndefined(); expect(bytes).toEqual(original); expect(kit.source).toEqual(original);
  });
  it.each([[0, 0], [15]])('rejects invalid sample assignments %j', (...indices) => {
    expect(() => readStk(makeKit(indices))).toThrow();
  });
  it.each([0, 1, 15, 16, 31, 4243, 4245, 4259])('rejects truncation at %i', length => {
    expect(() => readStk(makeKit().slice(0, length))).toThrow();
  });
  it.each([0, 4, 15, 0xffffffff])('rejects invalid chunk length %i', size => {
    const bytes = makeKit(); new DataView(bytes.buffer).setUint32(4248, size, true);
    expect(() => readStk(bytes)).toThrow();
  });
  it('accepts differing outer size conventions and reports marker differences', () => {
    const bytes = makeKit(); const view = new DataView(bytes.buffer);
    view.setUint32(4, 1, true); view.setUint32(4260 - 4, 7, true);
    expect(readStk(bytes).diagnostics.length).toBeGreaterThan(0);
  });
  it('preserves unknown bounded chunks', () => {
    const original = makeKit(); const bytes = new Uint8Array(original.length + 16); bytes.set(original);
    bytes.set(new TextEncoder().encode('TEST'), original.length);
    new DataView(bytes.buffer).setUint32(original.length + 4, 16, true);
    const kit = readStk(bytes); expect(kit.chunks.at(-1)?.tag).toBe('TEST');
    expect(kit.source).toEqual(bytes);
  });
});
