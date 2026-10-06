import { expect, it } from 'vitest';
import { readStk } from './readStk';
import { makeKit } from './testFixtures';
import { getKitSummary, getSlotDetails, getValidationFindings } from './inspectKit';
import { padRows } from '../presentation/padLayout';
import { getPadColor } from '../presentation/padPalette';
it('projects sparse kit metadata without binary content', () => {
  const kit = readStk(makeKit()); const summary = getKitSummary(kit);
  expect(summary.populatedSlots).toBe(3); expect(summary.slots).toHaveLength(15);
  expect(getSlotDetails(kit, 6)).toMatchObject({ slotNumber: 6, level: 56, pan: 'L53', fxSend: 46, pitch: { cents: -200, confirmed: false } });
  expect(getSlotDetails(kit, 2).sample).toBeNull();
  expect(JSON.stringify([summary, getSlotDetails(kit, 1), getValidationFindings(kit)])).not.toMatch(/rawRecord|trailingBytes|source|"bytes"/);
});
it.each([0, 16, 1.5, NaN, Infinity])('rejects invalid public slot %s', slot => { expect(() => getSlotDetails(readStk(makeKit()), slot)).toThrow(); });
it('maps physical pads and provisional colors without reordering slots', () => {
  expect(padRows).toEqual([[2,4,6,8,10,12,14],[1,3,5,7,9,11,13,15]]);
  expect(getPadColor(29).number).toBe(30); expect(getPadColor(255).number).toBeNull();
});
