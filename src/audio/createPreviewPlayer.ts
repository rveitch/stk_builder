export interface PreviewPlayer { play(bytes: Uint8Array): Promise<void>; stop(): void; dispose(): Promise<void> }
export function createPreviewPlayer(factory: () => AudioContext = () => new AudioContext(), onEnd: () => void = () => {}): PreviewPlayer {
  let context: AudioContext | undefined; let source: AudioBufferSourceNode | undefined; let gain: GainNode | undefined;
  let generation = 0; let disposed = false;
  function stop() {
    generation += 1;
    if (source) { source.onended = null; source.stop(); source.disconnect(); source = undefined; }
    gain?.disconnect(); gain = undefined; onEnd();
  }
  async function play(bytes: Uint8Array) {
    if (disposed) throw new Error('Preview player is closed.');
    stop(); const current = generation; context ??= factory();
    if (context.state === 'suspended') await context.resume();
    if (current !== generation) return;
    const decoded = await context.decodeAudioData(bytes.slice().buffer as ArrayBuffer);
    if (current !== generation || disposed) return;
    gain = context.createGain(); gain.gain.value = 0.5; gain.connect(context.destination);
    source = context.createBufferSource(); source.buffer = decoded; source.connect(gain);
    source.onended = () => { source?.disconnect(); gain?.disconnect(); source = undefined; gain = undefined; onEnd(); };
    source.start();
  }
  async function dispose() { stop(); disposed = true; await context?.close(); context = undefined; }
  return { play, stop, dispose };
}
