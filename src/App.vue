<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
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
const { kit, filename, selectedSlot, loading, error, importFile, selectSlot, dispose } = useKitInspector(stop);
const summary = computed(() => kit.value ? getKitSummary(kit.value) : null);
const details = computed(() => kit.value ? getSlotDetails(kit.value, selectedSlot.value) : null);
const rawOpen = ref(false);
const raw = computed(() => kit.value ? { header: kit.value.header, slotRecordHex: Array.from(kit.value.slots[selectedSlot.value - 1]!.rawRecord, byte => byte.toString(16).padStart(2, '0')).join(' '), chunkCount: kit.value.chunks.length, chunks: kit.value.chunks.slice(0, 100) } : null);
async function play() {
  const sample = kit.value?.slots[selectedSlot.value - 1]?.sample; if (!sample?.info.previewSupported) return;
  stop(); const current = previewGeneration; previewBusy.value = true;
  try { await player.play(sample.bytes); if (current === previewGeneration) playing.value = true; }
  catch (cause) { if (current === previewGeneration) previewError.value = cause instanceof Error ? cause.message : 'Preview failed.'; }
  finally { if (current === previewGeneration) previewBusy.value = false; }
}
onBeforeUnmount(() => { dispose(); void player.dispose(); });
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
        <div><span class="eyebrow">KIT INSPECTOR / 01</span><h1>Meet your kit.</h1><p>Explore every sample, slot, and setting.</p></div><span class="version-label">IMPORT & INSPECT<br>PREVIEW RELEASE</span>
      </div>
      <KitImport
        :loading="loading"
        :compact="Boolean(kit)"
        @import="importFile"
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
      <section class="kit-panel">
        <header class="section-heading">
          <div><span class="eyebrow">PAD LAYOUT</span><h2>{{ filename || '15 slots. Endless possibilities.' }}</h2></div><span class="muted">{{ summary ? `${summary.populatedSlots} / 15 samples` : 'SmplTrek layout' }}</span>
        </header>
        <PadGrid
          :kit="kit"
          :selected-slot="selectedSlot"
          @select="selectSlot"
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
