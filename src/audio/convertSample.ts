import { encodePcm16, trimAudio, type PcmAudio } from '../core/sampleAudio';
export async function convertSample(audio: PcmAudio, start: number, end: number): Promise<Uint8Array<ArrayBuffer>> {
  const trimmed = trimAudio(audio,start,end);
  if (trimmed.sampleRate === 48000) return encodePcm16(trimmed.channels);
  const frames = Math.max(1,Math.round(trimmed.channels[0]!.length * 48000 / trimmed.sampleRate));
  const context = new OfflineAudioContext(trimmed.channels.length,frames,48000);
  const buffer = context.createBuffer(trimmed.channels.length,trimmed.channels[0]!.length,trimmed.sampleRate);
  trimmed.channels.forEach((channel,index) => buffer.getChannelData(index).set(channel));
  const source = context.createBufferSource(); source.buffer=buffer; source.connect(context.destination); source.start();
  try { const rendered=await context.startRendering(); return encodePcm16(Array.from({length:rendered.numberOfChannels},(_,index)=>rendered.getChannelData(index))); }
  finally { source.disconnect(); }
}
