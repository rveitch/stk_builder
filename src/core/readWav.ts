import { FormatError, readTag, readUint32, requireBytes } from './binary';
import { maxChunkCount, type Chunk, type WavInfo } from './types';
export function readWav(bytes: Uint8Array): WavInfo {
  requireBytes(bytes, 0, 12);
  if (readTag(bytes, 0) !== 'RIFF' || readTag(bytes, 8) !== 'WAVE' || readUint32(bytes, 4) + 8 !== bytes.length) throw new FormatError('WAV_HEADER', 0, 'Invalid RIFF/WAVE boundary');
  const chunks: Chunk[] = []; let fmt: WavInfo | undefined; let dataSize: number | undefined; let blockAlign = 0; let byteRate = 0;
  for (let offset = 12; offset < bytes.length;) {
    if (chunks.length >= maxChunkCount) throw new FormatError('CHUNK_LIMIT', offset, 'WAV chunk limit exceeded');
    requireBytes(bytes, offset, 8); const tag = readTag(bytes, offset); const size = readUint32(bytes, offset + 4);
    requireBytes(bytes, offset + 8, size + size % 2); chunks.push({ tag, offset, size });
    if (tag === 'fmt ') {
      if (fmt || size < 16) throw new FormatError('WAV_FMT', offset, 'Invalid or duplicate WAV format');
      const view = new DataView(bytes.buffer, bytes.byteOffset + offset + 8, size);
      const format = view.getUint16(0, true); const channels = view.getUint16(2, true); const sampleRate = view.getUint32(4, true); const bitDepth = view.getUint16(14, true);
      byteRate = view.getUint32(8, true); blockAlign = view.getUint16(12, true);
      if (!channels || !sampleRate || !blockAlign) throw new FormatError('WAV_FMT', offset, 'Invalid WAV channel, rate, or alignment');
      const previewSupported = format === 1 && [1, 2].includes(channels) && [8, 16, 24, 32].includes(bitDepth);
      if (format === 1 && (blockAlign !== channels * bitDepth / 8 || byteRate !== sampleRate * blockAlign)) throw new FormatError('WAV_PCM', offset, 'Inconsistent PCM format');
      fmt = { format, channels, sampleRate, bitDepth, durationSeconds: null, previewSupported, chunks };
    }
    if (tag === 'data') { if (dataSize !== undefined) throw new FormatError('WAV_DATA', offset, 'Duplicate WAV data'); dataSize = size; }
    offset += 8 + size + size % 2;
  }
  if (!fmt || dataSize === undefined) throw new FormatError('WAV_REQUIRED', 12, 'WAV requires fmt and data chunks');
  if (fmt.format === 1) {
    if (dataSize % blockAlign) throw new FormatError('WAV_FRAMES', 12, 'Incomplete PCM frame');
    fmt.durationSeconds = dataSize / byteRate;
  }
  return fmt;
}
