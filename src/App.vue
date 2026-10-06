<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import SampleImport from './components/SampleImport.vue';
import { useSampleImport } from './composables/useSampleImport';
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
const { replaceSlotSample, dirty, editSlot, resetEdits, kit, filename, selectedSlot, loading, error, importFile, selectSlot, dispose } = useKitInspector(stop);
const sampleImport = useSampleImport(undefined,stop);
const { source: sampleSource, name: sampleName, error: sampleError, busy: sampleBusy, start: sampleStart, end: sampleEnd, prepared: preparedSample } = sampleImport;
watch([kit,selectedSlot,loading], () => sampleImport.clear(), {flush:'sync'});
async function loadSample(slot: number,file: File) {
  if (!kit.value || loading.value || !canEditKit(kit.value)) return;
  selectSlot(slot); exportStatus.value=''; await sampleImport.load(file);
}
function applySample() {
  if (!preparedSample.value || !kit.value || loading.value) return;
  try { replaceSlotSample(selectedSlot.value,preparedSample.value,sampleName.value); editError.value=''; exportStatus.value='Sample applied. Export a copy to save your kit.'; }
  catch (cause) { editError.value=cause instanceof Error ? cause.message : 'Unable to replace sample.'; }
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
  if (!kit.value || loading.value) return;
  try { downloadKit(writeStk(kit.value), filename.value, dirty.value); exportStatus.value = 'Download requested. Your imported file is unchanged.'; editError.value = ''; }
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
onBeforeUnmount(() => { window.removeEventListener('beforeunload', guardNavigation); sampleImport.clear(); dispose(); void player.dispose(); });
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
      <div class="page-heading">
        <div><span class="eyebrow">KIT INSPECTOR / 01</span><h1>Meet your kit.</h1><p>Explore every sample, slot, and setting.</p></div><span class="version-label">EDIT & EXPORT<br>PREVIEW RELEASE</span>
      </div>
      <KitImport
        :loading="loading"
        :compact="Boolean(kit)"
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
            Parameter exports verified on SmplTrek. Sample replacement is experimental; unedited slots are preserved.
          </p>
        </div>
        <div class="export-actions">
          <button
            class="secondary-button"
            :disabled="!dirty || loading"
            @click="reset"
          >
            Reset all edits
          </button><button
            class="primary-button"
            :disabled="loading"
            @click="exportKit"
          >
            Export STK copy
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
      <section class="kit-panel">
        <header class="section-heading">
          <div><span class="eyebrow">PAD LAYOUT</span><h2>{{ filename || '15 slots. Endless possibilities.' }}</h2></div><span class="muted">{{ summary ? `${summary.populatedSlots} / 15 samples` : 'SmplTrek layout' }}</span>
        </header>
        <PadGrid
          :kit="kit"
          :selected-slot="selectedSlot"
          @select="selectSlot"
          @sample="loadSample"
        />
        <footer class="pad-caption">
          <span>Upper: even slots · Lower: odd slots</span><span>{{ kit ? 'Select a pad to inspect' : 'Open a kit to get started' }}</span>
        </footer>
      </section>
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
        v-model:start="sampleStart"
        v-model:end="sampleEnd"
        :slot-number="selectedSlot"
        :name="sampleName"
        :duration="sampleSource ? sampleSource.channels[0]!.length / sampleSource.sampleRate : 0"
        :channels="sampleSource?.channels.length ?? 1"
        :sample-rate="sampleSource?.sampleRate ?? 48000"
        :busy="sampleBusy"
        :prepared="Boolean(preparedSample)"
        :error="sampleError"
        :disabled="loading"
        @file="loadSample(selectedSlot, $event)"
        @prepare="sampleImport.prepare"
        @preview="preparedSample && playBytes(preparedSample)"
        @stop="stop"
        @apply="applySample"
        @cancel="sampleImport.clear"
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
      <AgentAccess :kit="kit" />
    </main>
    <footer class="app-footer">
      <span>STK BUILDER <span class="muted">/ Independent tool for Sonicware SmplTrek</span></span><span>Made for your sample collection.</span>
    </footer>
  </div>
</template>
