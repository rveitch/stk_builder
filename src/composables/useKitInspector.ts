import { ref, shallowRef } from 'vue';
import { readStk } from '../core/readStk';
import { maxImportBytes, type Kit } from '../core/types';
export function useKitInspector(onChange: () => void = () => {}) {
  const kit = shallowRef<Kit | null>(null); const filename = ref(''); const selectedSlot = ref(1);
  const loading = ref(false); const error = ref(''); let generation = 0;
  async function importFile(file: Pick<File, 'name' | 'size' | 'arrayBuffer'>) {
    generation += 1; const current = generation; onChange(); loading.value = true; error.value = '';
    try {
      if (file.size > maxImportBytes) throw new Error('Maximum import size is 64 MiB.');
      const buffer = await file.arrayBuffer(); if (current !== generation) return;
      const parsed = readStk(new Uint8Array(buffer));
      onChange();
      kit.value = parsed; filename.value = file.name; selectedSlot.value = (parsed.slots.find(s => s.sample)?.index ?? 0) + 1;
    } catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : 'Unable to read this kit.'; }
    finally { if (current === generation) loading.value = false; }
  }
  function selectSlot(slot: number) { if (Number.isInteger(slot) && slot >= 1 && slot <= 15) { onChange(); selectedSlot.value = slot; } }
  function dispose() { generation += 1; onChange(); kit.value = null; loading.value = false; }
  return { kit, filename, selectedSlot, loading, error, importFile, selectSlot, dispose };
}
