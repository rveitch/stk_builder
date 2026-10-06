import { computed, ref, shallowRef } from 'vue';
import { writeStk, type SlotEdit } from '../core/writeStk';
import { readStk } from '../core/readStk';
import { maxImportBytes, type Kit } from '../core/types';
export function useKitInspector(onChange: () => void = () => {}) {
  const original = shallowRef<Kit | null>(null);
  const dirty = computed(() => Boolean(kit.value && original.value && kit.value.slots.some((slot, index) => slot.rawRecord.some((byte, offset) => byte !== original.value!.slots[index]!.rawRecord[offset]))));
  const kit = shallowRef<Kit | null>(null); const filename = ref(''); const selectedSlot = ref(1);
  const loading = ref(false); const error = ref(''); let generation = 0;
  async function importFile(file: Pick<File, 'name' | 'size' | 'arrayBuffer'>) {
    generation += 1; const current = generation; onChange(); loading.value = true; error.value = '';
    try {
      if (file.size > maxImportBytes) throw new Error('Maximum import size is 64 MiB.');
      const buffer = await file.arrayBuffer(); if (current !== generation) return;
      const parsed = readStk(new Uint8Array(buffer));
      onChange();
      kit.value = parsed; original.value = parsed; filename.value = file.name; selectedSlot.value = (parsed.slots.find(s => s.sample)?.index ?? 0) + 1;
    } catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : 'Unable to read this kit.'; }
    finally { if (current === generation) loading.value = false; }
  }
  function editSlot(slotNumber: number, values: SlotEdit['values']) {
    if (loading.value) throw new Error('Please wait until the kit finishes reading.');
    if (!kit.value) throw new Error('Open a kit first.');
    const updated = readStk(writeStk(kit.value, [{ slotNumber, values }])); onChange(); kit.value = updated;
  }
  function resetEdits() { if (!loading.value && original.value) { onChange(); kit.value = original.value; } }
  function selectSlot(slot: number) { if (Number.isInteger(slot) && slot >= 1 && slot <= 15) { onChange(); selectedSlot.value = slot; } }
  function dispose() { generation += 1; onChange(); kit.value = null; original.value = null; loading.value = false; }
  return { dirty, editSlot, resetEdits, kit, filename, selectedSlot, loading, error, importFile, selectSlot, dispose };
}
