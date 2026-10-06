import { expect, it } from 'vitest';
import { convertSample } from './convertSample';
import { decodeWav } from '../core/sampleAudio';
it('converts selected 48kHz frames to PCM16 without requiring browser APIs', async () => {
  const values = new Float32Array(48000); values[24000]=0.5;
  const bytes=await convertSample({sampleRate:48000,channels:[values]},0.5,1);
  const result=decodeWav(bytes); expect(result.channels[0]!.length).toBe(24000); expect(result.channels[0]![0]).toBeCloseTo(0.5,4);
});
it('rejects a too-long selection without starting browser rendering', async () => {
  await expect(convertSample({sampleRate:44100,channels:[new Float32Array(44100*6)]},0,6)).rejects.toThrow(/5.4/);
});
