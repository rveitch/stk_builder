export function makeWav(ancillary = false, format = 1): Uint8Array {
  const bytes = new Uint8Array(ancillary ? 58 : 48);
  const view = new DataView(bytes.buffer);
  function text(offset: number, value: string) { bytes.set(new TextEncoder().encode(value), offset); }
  text(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, format, true);
  view.setUint16(22, 1, true); view.setUint32(24, 48000, true); view.setUint32(28, 96000, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  let offset = 36;
  if (ancillary) { text(offset, 'JUNK'); view.setUint32(offset + 4, 1, true); bytes[offset + 8] = 42; offset += 10; }
  text(offset, 'data'); view.setUint32(offset + 4, 4, true);
  return bytes;
}
export function makeKit(indices = [0, 2, 5], padding = 0, ancillary = false): Uint8Array {
  const wav = makeWav(ancillary);
  const size = 16 + wav.length + padding;
  const bytes = new Uint8Array(4244 + indices.length * size);
  const view = new DataView(bytes.buffer);
  function text(offset: number, value: string) { bytes.set(new TextEncoder().encode(value), offset); }
  text(0, 'VDK0'); view.setUint32(4, bytes.length, true); view.setUint32(12, indices.length + 1, true);
  text(16, 'KTDT'); view.setUint32(20, 4228, true); view.setUint32(28, 1, true);
  for (let i = 0; i < 15; i += 1) { bytes[32 + i * 280 + 256] = 100; }
  for (const [order, index] of indices.entries()) {
    if (index < 15) {
      const record = 32 + index * 280;
      text(record, `SmplTrek/Pool/Audio/Sample${index}.wav`);
      bytes[record + 256] = 56; view.setInt8(record + 257, -53);
      view.setInt32(record + 260, -200, true); bytes[record + 272] = 46;
    }
    const offset = 4244 + order * size;
    text(offset, 'ISDT'); view.setUint32(offset + 4, size, true); view.setUint32(offset + 8, index, true);
    view.setUint32(offset + 12, 1, true); bytes.set(wav, offset + 16);
  }
  return bytes;
}
