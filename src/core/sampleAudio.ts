import { readWav } from './readWav';
export interface PcmAudio { sampleRate: number; channels: Float32Array[] }
export const maxWavImportBytes = 32 * 1024 * 1024;
export function sampleDurationLimit(channels: number): number { return channels === 1 ? 5.4 : 2.7; }
export function decodeWav(bytes: Uint8Array): PcmAudio {
  if (bytes.length > maxWavImportBytes) throw new Error('WAV import limit is 32 MiB.');
  const info = readWav(bytes);
  if (![1,2].includes(info.channels) || info.sampleRate < 8000 || info.sampleRate > 192000) throw new Error('Use a mono or stereo WAV at 8–192 kHz.');
  if (!((info.format === 1 && [8,16,24,32].includes(info.bitDepth)) || (info.format === 3 && [32,64].includes(info.bitDepth)))) throw new Error('Unsupported WAV encoding. Use integer PCM or IEEE float WAV.');
  const data = info.chunks.find(chunk => chunk.tag === 'data')!; const fmt = info.chunks.find(chunk => chunk.tag === 'fmt ')!;
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength); const width = info.bitDepth / 8; const alignment = width * info.channels;
  if (view.getUint16(fmt.offset+20,true) !== alignment || view.getUint32(fmt.offset+16,true) !== alignment * info.sampleRate || data.size % alignment) throw new Error('Invalid WAV frame alignment.');
  const frames = data.size / alignment;
  if (!frames || frames / info.sampleRate > 60) throw new Error('Use a nonempty WAV no longer than 60 seconds; trim the source first.');
  const channels = Array.from({length:info.channels}, () => new Float32Array(frames));
  for (let frame=0; frame<frames; frame+=1) for (let channel=0; channel<info.channels; channel+=1) {
    const offset = data.offset + 8 + frame * alignment + channel * width; let value: number;
    if (info.format === 3) value = width === 4 ? view.getFloat32(offset,true) : view.getFloat64(offset,true);
    else if (width === 1) value = (view.getUint8(offset)-128)/128;
    else if (width === 2) value = view.getInt16(offset,true)/32768;
    else if (width === 3) { const integer = view.getUint8(offset) | (view.getUint8(offset+1)<<8) | (view.getInt8(offset+2)<<16); value = integer/8388608; }
    else value = view.getInt32(offset,true)/2147483648;
    if (!Number.isFinite(value)) throw new Error('WAV samples must be finite.');
    // Preserve headroom within Float32 representability; clipping happens at PCM16 output.
    if (Math.abs(value) > 3.402823466e38) throw new Error('WAV sample magnitude is unsupported.');
    channels[channel]![frame] = value;
  }
  return { sampleRate: info.sampleRate, channels };
}
export function trimAudio(audio: PcmAudio, start: number, end: number): PcmAudio {
  const length = audio.channels[0]?.length ?? 0; const duration = length / audio.sampleRate; const limit = sampleDurationLimit(audio.channels.length);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end > duration + 1e-9 || end <= start) throw new Error('Choose a valid start and end within the source audio.');
  const first = Math.round(start * audio.sampleRate); const last = Math.min(length,Math.round(end * audio.sampleRate));
  if (last <= first || (last-first)/audio.sampleRate > limit + 1e-9) throw new Error(`Select at most ${limit} seconds for this sample.`);
  return { sampleRate:audio.sampleRate, channels:audio.channels.map(channel => channel.slice(first,last)) };
}
export function encodePcm16(channels: Float32Array[]): Uint8Array<ArrayBuffer> {
  const frames = channels[0]?.length ?? 0;
  if (![1,2].includes(channels.length) || !frames || channels.some(channel => channel.length !== frames) || frames > Math.floor(sampleDurationLimit(channels.length)*48000)) throw new Error('Invalid converted sample length or channel count.');
  const bytes = new Uint8Array(44 + frames * channels.length * 2); const view = new DataView(bytes.buffer);
  function tag(offset: number,value:string) { bytes.set(new TextEncoder().encode(value),offset); }
  tag(0,'RIFF'); view.setUint32(4,bytes.length-8,true); tag(8,'WAVE'); tag(12,'fmt '); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,channels.length,true); view.setUint32(24,48000,true); view.setUint32(28,48000*channels.length*2,true); view.setUint16(32,channels.length*2,true); view.setUint16(34,16,true); tag(36,'data'); view.setUint32(40,bytes.length-44,true);
  for (let frame=0; frame<frames; frame+=1) for (let channel=0; channel<channels.length; channel+=1) {
    const value = channels[channel]![frame]!; if (!Number.isFinite(value)) throw new Error('Samples must be finite.');
    const clipped = Math.max(-1,Math.min(1,value)); view.setInt16(44+(frame*channels.length+channel)*2,Math.round(clipped < 0 ? clipped*32768 : clipped*32767),true);
  }
  return bytes;
}
