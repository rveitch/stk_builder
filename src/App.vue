<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { KitAgentContext } from './agents/kitTools';
import { useAgentSampleLibrary } from './composables/useAgentSampleLibrary';
import SampleImport from './components/SampleImport.vue';
import { usePadSamples } from './composables/usePadSamples';
import PadEditor from './components/PadEditor.vue';
import ParameterEditor from './components/ParameterEditor.vue';
import { canEditKit, writeStk, type SlotEdit } from './core/writeStk';
import { downloadKit } from './files/downloadKit';
import AgentAccess from './components/AgentAccess.vue';
import KitImport from './components/KitImport.vue';
import PadGrid from './components/PadGrid.vue';
import SlotDetails from './components/SlotDetails.vue';
import { useKitInspector } from './composables/useKitInspector';
import { createPreviewPlayer } from './audio/createPreviewPlayer';
import { getKitSummary, getSlotDetails } from './core/inspectKit';
const playing = ref(false); const previewBusy = ref(false); const previewError = ref(''); let previewGeneration = 0;
const player = createPreviewPlayer(undefined, () => { playing.value = false; });
function stop() { previewGeneration += 1; player.stop(); playing.value = false; previewBusy.value = false; previewError.value = ''; }
const { session, kitName, renameKit, newKit, modifyPad, replaceSlotSample, dirty, editSlot, resetEdits, kit, selectedSlot, loading, error, importFile, selectSlot, dispose } = useKitInspector(stop);
const samples=usePadSamples((slot,bytes,name)=>{ replaceSlotSample(slot,bytes,name); exportStatus.value='Sample assigned.'; });
const {busy:sampleBusy}=samples;
const library=useAgentSampleLibrary();const agentBusy=ref(false);const agentRevision=ref(0);
watch([kit,kitName,session],()=>{agentRevision.value+=1;},{flush:'sync'});
const agentContext:KitAgentContext={
 getState(){if(!kit.value)throw new Error('No kit is open.');return {kit:kit.value,name:kitName.value,revision:agentRevision.value,busy:loading.value||sampleBusy.value};},
 listSamples:library.list,readSample:library.read,
 setProcessing(value){agentBusy.value=value;},
 commit(updated,name){stop();if(kit.value)samples.reconcile(kit.value,updated);kit.value=updated;kitName.value=name;exportStatus.value='Agent changes applied. Review your kit or reset all edits.';},
};
function addAgentSamples(files:File[]){try{library.add(files);editError.value='';}catch(cause){editError.value=(cause as Error).message;}}

watch(session,()=>samples.clear(),{flush:'sync'});
function loadSample(slot:number,file:File){
 if(!kit.value||loading.value||!canEditKit(kit.value))return;
 selectSlot(slot);stop();exportStatus.value='';void samples.assign(slot,file);
}
function startNewKit(){if(dirty.value&&!window.confirm('Discard current changes and start a new kit?'))return;newKit();exportStatus.value='';editError.value='';}
function changeKitName(event:Event){const input=event.target as HTMLInputElement;try{renameKit(input.value);editError.value='';}catch(cause){editError.value=(cause as Error).message;}input.value=kitName.value;}
function editPad(operation:'clear'|'name'|'color',value:string|number=''){
 try{if(operation==='clear')samples.cancel(selectedSlot.value);modifyPad(selectedSlot.value,operation,value);editError.value='';if(operation==='name')samples.rename(selectedSlot.value,String(value));}
 catch(cause){editError.value=(cause as Error).message;}
}
const editError = ref(''); const exportStatus = ref('');
function applySettings(values: SlotEdit['values']) {
  try { editSlot(selectedSlot.value, values); editError.value = ''; exportStatus.value = ''; }
  catch (cause) { editError.value = cause instanceof Error ? cause.message : 'Unable to apply settings.'; }
}
async function replaceKit(file: File) {
  if (dirty.value && !window.confirm('Replace this kit and discard its applied edits? Export a copy first to keep them.')) return;
  editError.value = ''; exportStatus.value = ''; await importFile(file);
}
function exportKit() {
  if (!kit.value || loading.value || sampleBusy.value || agentBusy.value || !kit.value.slots.some(slot=>slot.sample)) return;
  try { downloadKit(writeStk(kit.value), kitName.value, dirty.value, true); exportStatus.value = 'Download requested. Your imported file is unchanged.'; editError.value = ''; }
  catch (cause) { editError.value = cause instanceof Error ? cause.message : 'Unable to export kit.'; }
}
function reset() { resetEdits(); editError.value = ''; exportStatus.value = ''; }
function guardNavigation(event: BeforeUnloadEvent) { if (dirty.value) { event.preventDefault(); event.returnValue = ''; } }
onMounted(() => window.addEventListener('beforeunload', guardNavigation));
const summary = computed(() => kit.value ? getKitSummary(kit.value) : null);
const details = computed(() => kit.value ? getSlotDetails(kit.value, selectedSlot.value) : null);
const rawOpen = ref(false);
const raw = computed(() => kit.value ? { header: kit.value.header, slotRecordHex: Array.from(kit.value.slots[selectedSlot.value - 1]!.rawRecord, byte => byte.toString(16).padStart(2, '0')).join(' '), chunkCount: kit.value.chunks.length, chunks: kit.value.chunks.slice(0, 100) } : null);
async function play() {
  const sample = kit.value?.slots[selectedSlot.value - 1]?.sample; if (!sample?.info.previewSupported) return;
  await playBytes(sample.bytes);
}
async function playBytes(bytes: Uint8Array) {
  stop(); const current = previewGeneration; previewBusy.value = true;
  try { await player.play(bytes); if (current === previewGeneration) playing.value = true; }
  catch (cause) { if (current === previewGeneration) previewError.value = cause instanceof Error ? cause.message : 'Preview failed.'; }
  finally { if (current === previewGeneration) previewBusy.value = false; }
}
onBeforeUnmount(() => { window.removeEventListener('beforeunload', guardNavigation); samples.clear(); dispose(); void player.dispose(); });
</script>
<template>
  <div class="app-shell">
    <header class="app-header">
      <a
        class="brand"
        href="./"
      ><span class="brand-mark">STK</span><span>BUILDER<small>SMPLTREK KIT WORKSPACE</small></span></a><span class="status-pill"><i /> ALL LOCAL</span>
    </header>
    <main>
      <section class="kit-toolbar">
        <label>Kit name<input
          :value="kitName"
          aria-label="Kit name"
          maxlength="48"
          :disabled="loading"
          @change="changeKitName"
        ></label><button
          class="secondary-button"
          @click="startNewKit"
        >
          New kit
        </button>
      </section>
      <KitImport
        :loading="loading"
        :compact="true"
        @import="replaceKit"
      />
      <p
        v-if="error"
        role="alert"
        class="error-message"
      >
        {{ error }}
      </p><p
        v-if="loading"
        role="status"
        class="muted"
      >
        Reading kit…
      </p>
      <section
        v-if="kit"
        class="export-panel"
      >
        <div>
          <strong>{{ dirty ? 'Applied edits ready to export' : 'Original kit · unchanged' }}</strong><p class="muted">
            Sample replacement verified on SmplTrek. New-kit defaults and color edits await a device check.
          </p>
        </div>
        <div class="export-actions">
          <button
            class="secondary-button"
            :disabled="(!dirty && !sampleBusy) || loading"
            @click="reset"
          >
            Reset all edits
          </button><button
            class="primary-button"
            :disabled="loading || sampleBusy || agentBusy || !summary?.populatedSlots"
            @click="exportKit"
          >
            Export kit
          </button>
        </div>
      </section>
      <p
        v-if="exportStatus"
        role="status"
        class="muted"
      >
        {{ exportStatus }}
      </p>
      <div class="pad-workspace">
        <section class="kit-panel">
          <header class="section-heading">
            <div><span class="eyebrow">PAD LAYOUT</span><h2>{{ kitName }}</h2></div><span class="muted">{{ summary ? `${summary.populatedSlots} / 15 samples` : 'SmplTrek layout' }}</span>
          </header>
          <PadGrid
            :kit="kit"
            :selected-slot="selectedSlot"
            :busy-slots="[...samples.entries].filter(([,entry])=>entry.busy).map(([slot])=>slot)"
            @select="selectSlot"
            @sample="loadSample"
          />
          <footer class="pad-caption">
            <span>Upper: even slots · Lower: odd slots</span><span>{{ kit ? 'Drop WAVs onto pads to assign' : 'Open a kit to get started' }}</span>
          </footer>
        </section>
        <section
          v-if="details"
          class="selected-pad-editor"
          aria-label="Selected pad editor"
        >
          <SlotDetails
            v-if="details"
            :details="details"
            :playing="playing"
            :busy="previewBusy"
            @play="play"
            @stop="stop"
          />
          <SampleImport
            v-if="kit && canEditKit(kit)"
            :slot-number="selectedSlot"
            :entry="samples.entries.get(selectedSlot)"
            :disabled="loading"
            @file="loadSample(selectedSlot,$event)"
            @trim="(start,end)=>samples.adjust(selectedSlot,start,end)"
          />
          <PadEditor
            v-if="details && kit && canEditKit(kit)"
            :key="selectedSlot + ':' + details.name"
            :name="details.sample ? details.name.replace(/\.wav$/i,'') : ''"
            :populated="Boolean(details.sample)"
            :color="details.color.deviceNumber"
            :disabled="loading || Boolean(samples.entries.get(selectedSlot)?.busy)"
            @rename="editPad('name',$event)"
            @color="editPad('color',$event)"
            @clear="editPad('clear')"
          />
          <ParameterEditor
            v-if="kit && canEditKit(kit)"
            :key="selectedSlot"
            :values="kit.slots[selectedSlot - 1]!.parameters"
            :disabled="loading"
            @apply="applySettings"
          />
          <p
            v-else-if="kit"
            class="notice"
          >
            This settings version supports unchanged export only.
          </p>
          <p
            v-if="editError"
            role="alert"
            class="error-message"
          >
            {{ editError }}
          </p>
          <p
            v-if="previewError"
            role="alert"
            class="error-message"
          >
            {{ previewError }}
          </p>
        </section>
      </div>
      <template v-if="kit">
        <section
          v-if="kit.diagnostics.length"
          class="findings"
        >
          <h3>Import notes</h3><ul>
            <li
              v-for="(finding, index) in kit.diagnostics.slice(0, 100)"
              :key="index"
            >
              {{ finding.slot ? `Slot ${finding.slot}: ` : '' }}{{ finding.message }}
            </li>
          </ul><p v-if="kit.diagnostics.length > 100">
            Showing the first 100 of {{ kit.diagnostics.length }} notes.
          </p>
        </section>
        <details
          class="raw-details"
          @toggle="rawOpen = ($event.target as HTMLDetailsElement).open"
        >
          <summary>File details & undecoded settings</summary><p>Slope, reverse, kit level, and LoFi are preserved as raw data. Their stored fields are not yet verified.</p><p>Chunk listing shows up to 100 entries.</p><pre v-if="rawOpen">{{ JSON.stringify(raw, null, 2) }}</pre>
        </details>
      </template>
      <p
        v-if="agentBusy"
        class="muted"
        role="status"
      >
        Agent is converting a sample…
      </p>
      <AgentAccess
        :kit="kit"
        :context="agentContext"
        :samples="library.list()"
        @add-samples="addAgentSamples"
        @clear-samples="library.clear"
      />
    </main>
    <footer class="app-footer">
      <span>STK BUILDER <span class="muted">/ Independent tool for Sonicware SmplTrek</span></span><span>Made for your sample collection.</span>
    </footer>
  </div>
</template>
