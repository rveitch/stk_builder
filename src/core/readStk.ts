import { FormatError, readTag, readUint32, requireBytes } from './binary';
import { readWav } from './readWav';
import { maxChunkCount, maxImportBytes, type Kit, type Slot } from './types';
export function readStk(bytes: Uint8Array): Kit {
  if (bytes.length > maxImportBytes) throw new FormatError('SIZE_LIMIT', 0, 'Maximum import size is 64 MiB');
  requireBytes(bytes, 0, 32);
  if (readTag(bytes, 0) !== 'VDK0' || readTag(bytes, 16) !== 'KTDT') throw new FormatError('STK_HEADER', 0, 'Not a supported SmplTrek STK file');
  const kitSize = readUint32(bytes, 20);
  if (kitSize < 4228) throw new FormatError('KTDT_SIZE', 20, 'Kit settings are incomplete');
  requireBytes(bytes, 16, kitSize);
  const source = bytes.slice();
  const kit: Kit = { source, slots: [], chunks: [{ tag: 'KTDT', offset: 16, size: kitSize }], header: { size: readUint32(bytes, 4), count: readUint32(bytes, 12) }, diagnostics: [] };
  function warning(code: string, message: string, offset: number, slot?: number) { kit.diagnostics.push({ severity: 'warning', code, message, offset, slot }); }
  if (readUint32(bytes, 28) !== 1) warning('KTDT_VERSION', 'Unrecognized kit settings marker; interpretations may differ.', 28);
  if (kitSize !== 4228) warning('KTDT_EXTENSION', 'Additional kit settings bytes preserved.', 20);
  for (let index = 0; index < 15; index += 1) {
    const offset = 32 + index * 280; const rawRecord = source.subarray(offset, offset + 280); const view = new DataView(rawRecord.buffer, rawRecord.byteOffset, 280);
    const pathBytes = rawRecord.subarray(0, 256); const terminator = pathBytes.indexOf(0);
    const path = new TextDecoder().decode(pathBytes.subarray(0, terminator < 0 ? 256 : terminator));
    if (terminator < 0) warning('PATH_TERMINATOR', 'Sample path has no terminator.', offset, index + 1);
    const slot: Slot = { index, path, rawRecord, parameters: { level: view.getUint8(256), pan: view.getInt8(257), pitchCents: view.getInt32(260, true), fxSend: view.getUint8(272), chokeCode: view.getUint8(273), colorCode: view.getUint8(274) } };
    kit.slots.push(slot);
  }
  for (let offset = 16 + kitSize; offset < source.length;) {
    if (kit.chunks.length >= maxChunkCount) throw new FormatError('CHUNK_LIMIT', offset, 'STK chunk limit exceeded');
    requireBytes(source, offset, 16); const tag = readTag(source, offset); const size = readUint32(source, offset + 4);
    if (size < 16) throw new FormatError('CHUNK_SIZE', offset, 'Chunk length must include its header');
    requireBytes(source, offset, size); kit.chunks.push({ tag, offset, size });
    if (tag === 'ISDT') {
      const index = readUint32(source, offset + 8); const slot = kit.slots[index];
      if (!slot || slot.sample) throw new FormatError('SLOT_INDEX', offset + 8, 'Invalid or duplicate sample slot');
      if (readUint32(source, offset + 12) !== 1) warning('ISDT_VERSION', 'Unrecognized sample marker.', offset + 12, index + 1);
      if (size < 28) throw new FormatError('ISDT_WAV', offset, 'Missing embedded WAV');
      const wavSize = readUint32(source, offset + 20) + 8;
      if (wavSize > size - 16) throw new FormatError('ISDT_WAV', offset, 'Embedded WAV exceeds its sample chunk');
      const wavBytes = source.subarray(offset + 16, offset + 16 + wavSize);
      const info = readWav(wavBytes);
      slot.sample = { bytes: wavBytes, info, trailingBytes: source.subarray(offset + 16 + wavSize, offset + size) };
      if (!info.previewSupported) warning('PREVIEW_UNSUPPORTED', 'Sample encoding is inspectable but preview is unsupported.', offset, index + 1);
      if (info.durationSeconds !== null && info.durationSeconds > (info.channels === 1 ? 5.4 : 2.7)) warning('DEVICE_LENGTH', 'Sample exceeds the documented device playback duration.', offset, index + 1);
    } else warning('UNKNOWN_CHUNK', `Unrecognized ${tag} chunk preserved.`, offset);
    offset += size;
  }
  for (const slot of kit.slots) if (Boolean(slot.path) !== Boolean(slot.sample)) warning('SAMPLE_ASSOCIATION', 'Sample path and embedded audio availability differ.', 32 + slot.index * 280, slot.index + 1);
  if (kit.header.count !== kit.chunks.length) warning('CHUNK_COUNT', 'Header chunk count differs from the parsed chunks.', 12);
  return kit;
}
