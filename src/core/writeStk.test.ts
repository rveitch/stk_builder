import { expect, it } from 'vitest';
import { readStk } from './readStk';
import { writeStk } from './writeStk';
import { makeKit } from './testFixtures';
it.each([false, true])('roundtrips every byte including ancillary metadata: %s', ancillary => {
  const bytes = makeKit([0, 2, 5], 2, ancillary); const kit = readStk(bytes);
  const output = writeStk(kit); expect(output).toEqual(bytes); expect(output).not.toBe(kit.source);
});
it('changes exactly the selected bytes and leaves original and samples intact', () => {
  const bytes = makeKit([0, 5], 2, true); const kit = readStk(bytes);
  const output = writeStk(kit, [{ slotNumber: 6, values: { level: 60, pan: 20, fxSend: 30 } }]);
  expect([...output.keys()].filter(i => output[i] !== bytes[i])).toEqual([1688, 1689, 1704]);
  expect(readStk(output).slots[5]!.parameters).toMatchObject({ level: 60, pan: 20, fxSend: 30 });
  expect(kit.source).toEqual(bytes); expect(kit.slots[5]!.parameters.level).toBe(56);
});
it.each([NaN, Infinity, -1, 128, 1.5])('rejects invalid level %s', level => {
  expect(() => writeStk(readStk(makeKit()), [{ slotNumber: 1, values: { level } }])).toThrow();
});
it.each([0, 16, 1.5, NaN])('rejects invalid slot %s', slotNumber => {
  expect(() => writeStk(readStk(makeKit()), [{ slotNumber, values: { level: 1 } }])).toThrow();
});
it('rejects unknown fields and out-of-range pan/send without mutation', () => {
  const kit = readStk(makeKit());
  for (const values of [{ pan: -54 }, { pan: 54 }, { fxSend: 128 }, { fxSend: -1 }, { reverse: 1 }]) {
    expect(() => writeStk(kit, [{ slotNumber: 1, values }])).toThrow();
  }
  expect(kit.source).toEqual(makeKit());
});
it('preserves unusual imported values on unchanged export', () => {
  const bytes = makeKit(); bytes[288] = 255; bytes[289] = 128;
  expect(writeStk(readStk(bytes))).toEqual(bytes);
});
it('allows unknown settings passthrough but refuses parameter editing', () => {
  const bytes = makeKit(); bytes[28] = 2; const kit = readStk(bytes);
  expect(writeStk(kit)).toEqual(bytes);
  expect(() => writeStk(kit, [{ slotNumber: 1, values: { level: 1 } }])).toThrow(/settings/);
});
