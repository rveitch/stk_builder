import { ref, shallowRef, watch } from 'vue';
import { decodeWav, maxWavImportBytes, type PcmAudio } from '../core/sampleAudio';
import { convertSample } from '../audio/convertSample';
export function useSampleImport(convert: typeof convertSample = convertSample, stop: () => void = () => {}) {
  const source = shallowRef<PcmAudio | null>(null); const name = ref(''); const error=ref(''); const busy=ref(false);
  const start=ref('0'); const end=ref('0'); const prepared=shallowRef<Uint8Array<ArrayBuffer> | null>(null); let generation=0;
  function invalidate() { generation+=1; prepared.value=null; busy.value=false; stop(); }
  watch([start,end],invalidate,{flush:'sync'});
  function clear() { invalidate(); source.value=null; name.value=''; error.value=''; }
  async function load(file: Pick<File,'name'|'size'|'arrayBuffer'>) {
    clear(); const current=generation; busy.value=true;
    try {
      if (file.size > maxWavImportBytes) throw new Error('WAV import limit is 32 MiB.');
      const buffer=await file.arrayBuffer(); if (current!==generation) return;
      const decoded=decodeWav(new Uint8Array(buffer)); source.value=decoded; name.value=file.name;
      start.value='0'; end.value=String(decoded.channels[0]!.length/decoded.sampleRate);
    } catch (cause) { if (current===generation) error.value=cause instanceof Error ? cause.message : 'Unable to read WAV.'; }
    finally { if (current===generation) busy.value=false; }
  }
  async function prepare() {
    invalidate(); error.value=''; if (!source.value) return; const current=generation; busy.value=true;
    try {
      if (!start.value.trim() || !end.value.trim()) throw new Error('Enter both start and end times.');
      const converted=await convert(source.value,Number(start.value),Number(end.value));
      if (current===generation) prepared.value=converted;
    } catch (cause) { if (current===generation) error.value=cause instanceof Error ? cause.message : 'Unable to convert WAV.'; }
    finally { if (current===generation) busy.value=false; }
  }
  return {source,name,error,busy,start,end,prepared,load,prepare,clear};
}
