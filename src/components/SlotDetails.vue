<script setup lang="ts">
import type { SlotDetails } from '../core/inspectKit';
import { getPadColor } from '../presentation/padPalette';
defineProps<{ details: SlotDetails; playing: boolean; busy: boolean }>();
defineEmits<{ play: []; stop: [] }>();
</script>
<template>
  <section class="detail-panel">
    <header class="detail-heading">
      <div><span class="eyebrow">SLOT {{ String(details.slotNumber).padStart(2, '0') }}</span><h2>{{ details.name }}</h2></div><button
        :disabled="!details.sample?.previewSupported || busy"
        class="primary-button"
        @click="playing ? $emit('stop') : $emit('play')"
      >
        {{ busy ? 'Loading…' : playing ? '■ Stop' : '▶ Preview' }}
      </button>
    </header>
    <p class="muted">
      Original sample preview at reduced volume. Device processing is not applied.
    </p>
    <p
      v-if="!details.sample"
      class="notice"
    >
      This slot has no embedded sample.
    </p>
    <p
      v-else-if="!details.sample.previewSupported"
      class="notice"
    >
      Preview unavailable for this WAV encoding. Metadata remains available.
    </p>
    <div class="parameter-grid">
      <div><span>Level</span><strong>{{ details.level }}</strong></div><div><span>Pan</span><strong>{{ details.pan }}</strong></div><div><span>FX send</span><strong>{{ details.fxSend }}</strong></div><div><span>Choke code</span><strong>{{ details.chokeCode }}</strong><small>OFF mapping unverified</small></div>
      <div><span>Pitch · Unverified</span><strong>{{ details.pitch.cents }} <small>cents</small></strong></div><div>
        <span>Pad color · Unverified</span><strong><i
          class="swatch"
          :style="{ background: getPadColor(details.color.storedValue).hex }"
        />{{ details.color.deviceNumber ?? 'Unknown' }}</strong><small>Approximate LED color</small>
      </div>
    </div>
    <div
      v-if="details.sample"
      class="sample-stats"
    >
      <span>{{ details.sample.durationSeconds?.toFixed(3) ?? 'Unknown' }} s</span><span>{{ details.sample.sampleRate.toLocaleString() }} Hz</span><span>{{ details.sample.bitDepth }}-bit</span><span>{{ details.sample.channels === 1 ? 'Mono' : details.sample.channels === 2 ? 'Stereo' : `${details.sample.channels} channels` }}</span>
    </div>
    <p class="sample-path">
      {{ details.path || 'No sample path assigned' }}
    </p>
  </section>
</template>
