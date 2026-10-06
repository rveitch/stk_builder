import type { Kit } from './types';
import { maxChunkCount, maxImportBytes } from './types';
import { canEditKit } from './writeStk';
import { readUint32 } from './binary';
import { readWav } from './readWav';
import { sampleDurationLimit } from './sampleAudio';
/** Rebuild the selected ISDT chunk while copying all other bytes verbatim. */
export function replaceSample(kit: Kit, slotNumber: number, wav: Uint8Array, filename: string): Uint8Array<ArrayBuffer> {
  if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 15) throw new Error('Slot must be an integer from 1 to 15.');
  if (!canEditKit(kit)) throw new Error('Unrecognized kit settings version.');
  const info = readWav(wav);
  if (info.format !== 1 || info.bitDepth !== 16 || info.sampleRate !== 48000 || ![1,2].includes(info.channels) || !info.durationSeconds || info.durationSeconds > sampleDurationLimit(info.channels)) throw new Error('Replacement must be 48 kHz / 16-bit mono or stereo WAV within the pad duration limit.');
  const index = slotNumber-1; const oldChunk = kit.chunks.find(chunk => chunk.tag === 'ISDT' && readUint32(kit.source,chunk.offset+8) === index);
  const trailer = kit.slots[index]!.sample?.trailingBytes ?? new Uint8Array();
  if (oldChunk && (readUint32(kit.source,oldChunk.offset+12) !== 1 || ![0,2].includes(trailer.length) || trailer.some(byte => byte !== 0))) throw new Error('Unrecognized sample chunk marker or trailer; replacement is unavailable for this slot.');
  const discount = kit.slots.reduce((sum,slot) => sum + (slot.sample ? 24 + slot.sample.trailingBytes.length : 0),0);
  const declared = readUint32(kit.source,4); const physical = declared === kit.source.length;
  if (!physical && declared !== kit.source.length-discount) throw new Error('Unrecognized outer size convention; sample replacement is unavailable.');
  if (kit.header.count !== kit.chunks.length) throw new Error('Unrecognized chunk count; sample replacement is unavailable.');
  if (!oldChunk && kit.chunks.length >= maxChunkCount) throw new Error('STK chunk limit exceeded.');
  const chunk = new Uint8Array(16+wav.length+trailer.length); const view = new DataView(chunk.buffer);
  chunk.set(new TextEncoder().encode('ISDT')); view.setUint32(4,chunk.length,true); view.setUint32(8,index,true); view.setUint32(12,1,true); chunk.set(wav,16); chunk.set(trailer,16+wav.length);
  const offset = oldChunk?.offset ?? kit.source.length; const oldSize = oldChunk?.size ?? 0;
  const size = kit.source.length-oldSize+chunk.length; if (size > maxImportBytes) throw new Error('Result exceeds the 64 MiB kit limit.');
  const output = new Uint8Array(size); output.set(kit.source.subarray(0,offset)); output.set(chunk,offset); output.set(kit.source.subarray(offset+oldSize),offset+chunk.length);
  const header = new DataView(output.buffer); header.setUint32(4,physical ? size : size-discount-(oldChunk ? 0 : 24),true); header.setUint32(12,kit.chunks.length+(oldChunk ? 0 : 1),true);
  const basename = (filename.split(/[\\/]/).at(-1) || 'Sample').replace(/\.wav$/i,'').replace(/[^a-zA-Z0-9 _-]/g,'_').slice(0,48).trim() || 'Sample';
  const path = new TextEncoder().encode(`SmplTrek/Pool/Audio/${basename}.wav`); const record = 32+index*280;
  output.fill(0,record,record+256); output.set(path,record);
  return output;
}
