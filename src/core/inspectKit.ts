import type { Kit } from './types';
export function getKitSummary(kit: Kit) {
  return { slotCount: 15, populatedSlots: kit.slots.filter(slot => slot.sample).length, fileSize: kit.source.length,
    slots: kit.slots.map(slot => ({ slotNumber: slot.index + 1, name: slot.path.split('/').at(-1) || 'Empty slot', populated: Boolean(slot.sample) })) };
}
export function getSlotDetails(kit: Kit, slotNumber: number) {
  if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 15) throw new Error('Slot must be an integer from 1 to 15.');
  const slot = kit.slots[slotNumber - 1]!; const p = slot.parameters;
  return { slotNumber, name: slot.path.split('/').at(-1) || 'Empty slot', path: slot.path, level: p.level,
    pan: p.pan === 0 ? 'CTR' : `${p.pan < 0 ? 'L' : 'R'}${Math.abs(p.pan)}`, fxSend: p.fxSend, chokeCode: p.chokeCode,
    pitch: { cents: p.pitchCents, confirmed: false }, color: { storedValue: p.colorCode, deviceNumber: p.colorCode < 30 ? p.colorCode + 1 : null, confirmed: false },
    sample: slot.sample ? { format: slot.sample.info.format, channels: slot.sample.info.channels, sampleRate: slot.sample.info.sampleRate, bitDepth: slot.sample.info.bitDepth, durationSeconds: slot.sample.info.durationSeconds, previewSupported: slot.sample.info.previewSupported } : null };
}
export function getValidationFindings(kit: Kit) { return kit.diagnostics.map(diagnostic => ({ ...diagnostic })); }
export type SlotDetails = ReturnType<typeof getSlotDetails>;
