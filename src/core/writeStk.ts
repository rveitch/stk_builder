import type { Kit } from './types';
import { readUint32 } from './binary';
export const parameterLimits = { level: { min: 0, max: 127 }, pan: { min: -53, max: 53 }, fxSend: { min: 0, max: 127 } } as const;
export type EditableParameter = keyof typeof parameterLimits;
export interface SlotEdit { slotNumber: number; values: Partial<Record<EditableParameter, number>> }
const parameterOffsets = { level: 256, pan: 257, fxSend: 272 } as const;
export function canEditKit(kit: Kit): boolean {
  return readUint32(kit.source, 20) === 4228 && readUint32(kit.source, 28) === 1;
}
/** Copy original bytes and patch only explicitly requested, validated settings. */
export function writeStk(kit: Kit, edits: readonly SlotEdit[] = []): Uint8Array<ArrayBuffer> {
  if (edits.length && !canEditKit(kit)) throw new Error('This kit settings version is available for unchanged export only.');
  const output = new Uint8Array(kit.source); const view = new DataView(output.buffer);
  for (const edit of edits) {
    if (!Number.isInteger(edit.slotNumber) || edit.slotNumber < 1 || edit.slotNumber > 15) throw new Error('Slot must be an integer from 1 to 15.');
    for (const [key, value] of Object.entries(edit.values)) {
      if (!Object.hasOwn(parameterLimits, key)) throw new Error(`Unsupported parameter: ${key}`);
      const field = key as EditableParameter; const { min, max } = parameterLimits[field];
      if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${field} must be an integer from ${min} to ${max}.`);
      const offset = 32 + (edit.slotNumber - 1) * 280 + parameterOffsets[field];
      if (field === 'pan') view.setInt8(offset, value); else view.setUint8(offset, value);
    }
  }
  return output;
}
