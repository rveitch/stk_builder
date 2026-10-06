import { createKit, clearPad, renameSample, setPadColor, validateName } from '../core/kitEditing';
import { replaceSample } from '../core/replaceSample';
import { computed, ref, shallowRef } from 'vue';
import { writeStk, type SlotEdit } from '../core/writeStk';
import { readStk } from '../core/readStk';
import { maxImportBytes, type Kit } from '../core/types';
export function useKitInspector(onChange: () => void = () => {}) {
  const initial=createKit(); const original = shallowRef<Kit | null>(initial);
  const kitName=ref('New Kit'); const originalName=ref('New Kit'); const session=ref(0);
  const dirty = computed(() => Boolean(kit.value && original.value && (kitName.value !== originalName.value || kit.value.source.length !== original.value.source.length || kit.value.source.some((byte,index) => byte !== original.value!.source[index]))));
  const kit = shallowRef<Kit | null>(initial); const filename = ref('New Kit.stk'); const selectedSlot = ref(1);
  const loading = ref(false); const error = ref(''); let generation = 0;
  async function importFile(file: Pick<File, 'name' | 'size' | 'arrayBuffer'>) {
    generation += 1; session.value+=1; const current = generation; onChange(); loading.value = true; error.value = '';
    try {
      if (file.size > maxImportBytes) throw new Error('Maximum import size is 64 MiB.');
      const buffer = await file.arrayBuffer(); if (current !== generation) return;
      const parsed = readStk(new Uint8Array(buffer));
      onChange();
      kit.value = parsed; original.value = parsed; filename.value = file.name; kitName.value=file.name.replace(/\.stk$/i,''); originalName.value=kitName.value; selectedSlot.value = (parsed.slots.find(s => s.sample)?.index ?? 0) + 1;
    } catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : 'Unable to read this kit.'; }
    finally { if (current === generation) loading.value = false; }
  }
  function editSlot(slotNumber: number, values: SlotEdit['values']) {
    if (loading.value) throw new Error('Please wait until the kit finishes reading.');
    if (!kit.value) throw new Error('Open a kit first.');
    const updated = readStk(writeStk(kit.value, [{ slotNumber, values }])); onChange(); kit.value = updated;
  }
  function replaceSlotSample(slotNumber: number, wav: Uint8Array, name: string) {
    if (loading.value) throw new Error('Please wait until the kit finishes reading.');
    if (!kit.value) throw new Error('Open a kit first.');
    const updated = readStk(replaceSample(kit.value,slotNumber,wav,name)); onChange(); kit.value=updated;
  }
  function renameKit(name:string) { kitName.value=validateName(name); }
  function newKit() { generation+=1; session.value+=1; onChange(); const fresh=createKit(); kit.value=fresh;original.value=fresh;kitName.value='New Kit';originalName.value='New Kit';filename.value='New Kit.stk';selectedSlot.value=1;loading.value=false;error.value=''; }
  function modifyPad(slotNumber:number, operation:'clear'|'name'|'color', value:string|number='') {
    if(loading.value||!kit.value)throw new Error('Wait for the kit to finish loading.');
    const bytes=operation==='clear'?clearPad(kit.value,slotNumber):operation==='name'?renameSample(kit.value,slotNumber,String(value)):setPadColor(kit.value,slotNumber,Number(value));
    onChange();kit.value=readStk(bytes);
  }
  function resetEdits() { if (!loading.value && original.value) { session.value+=1; onChange(); kit.value = original.value; kitName.value=originalName.value; } }
  function selectSlot(slot: number) { if (Number.isInteger(slot) && slot >= 1 && slot <= 15) { onChange(); selectedSlot.value = slot; } }
  function dispose() { generation += 1; session.value+=1; onChange(); kit.value = null; original.value = null; loading.value = false; }
  return { session, kitName, renameKit, newKit, modifyPad, replaceSlotSample, dirty, editSlot, resetEdits, kit, filename, selectedSlot, loading, error, importFile, selectSlot, dispose };
}
