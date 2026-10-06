import { expect, it, vi } from 'vitest';
import { createPreviewPlayer } from './createPreviewPlayer';
function audioHarness() {
  let finish!: (buffer: AudioBuffer) => void;
  const start = vi.fn(); const stop = vi.fn(); const disconnect = vi.fn();
  const context = { state: 'running', destination: {}, resume: vi.fn(async () => {}), close: vi.fn(async () => {}),
    decodeAudioData: vi.fn(() => new Promise<AudioBuffer>(resolve => { finish = resolve; })),
    createGain: () => ({ gain: { value: 0 }, connect: vi.fn(), disconnect }),
    createBufferSource: () => ({ buffer: null, connect: vi.fn(), start, stop, disconnect, onended: null }) };
  return { context, start, stop, finish: () => finish({} as AudioBuffer) };
}
it('does not start a decode completed after stop', async () => {
  const h = audioHarness(); const player = createPreviewPlayer(() => h.context as unknown as AudioContext);
  const pending = player.play(new Uint8Array(48)); await Promise.resolve(); player.stop(); h.finish(); await pending;
  expect(h.start).not.toHaveBeenCalled(); await player.dispose();
});
it('stops an active source and releases context on dispose', async () => {
  const h = audioHarness(); const player = createPreviewPlayer(() => h.context as unknown as AudioContext);
  const pending = player.play(new Uint8Array(48)); await Promise.resolve(); h.finish(); await pending;
  expect(h.start).toHaveBeenCalledOnce(); await player.dispose(); expect(h.stop).toHaveBeenCalledOnce(); expect(h.context.close).toHaveBeenCalledOnce();
});
