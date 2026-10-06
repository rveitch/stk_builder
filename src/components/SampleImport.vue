<script setup lang="ts">
import { sampleDurationLimit } from '../core/sampleAudio';
defineProps<{ slotNumber:number; name:string; duration:number; channels:number; sampleRate:number; start:string; end:string; busy:boolean; prepared:boolean; error:string; disabled:boolean }>();
const emit=defineEmits<{ file:[file:File]; 'update:start':[value:string]; 'update:end':[value:string]; prepare:[]; preview:[]; stop:[]; apply:[]; cancel:[] }>();
function choose(event:Event) { const input=event.target as HTMLInputElement; const file=input.files?.[0]; if (file) emit('file',file); input.value=''; }
</script>
<template>
  <section class="sample-import">
    <header class="detail-heading">
      <div><span class="eyebrow">SAMPLE REPLACEMENT</span><h3>WAV for slot {{ slotNumber }}</h3></div><label class="primary-button file-button">Choose WAV<input
        type="file"
        accept=".wav,audio/wav"
        aria-label="Choose WAV"
        :disabled="disabled || busy"
        @change="choose"
      ></label>
    </header>
    <p class="muted">
      Choose a file or drop a WAV onto a pad. Original files stay unchanged. Output: 48 kHz / 16-bit, preserving mono or stereo.
    </p>
    <p
      v-if="busy"
      role="status"
    >
      Preparing audio…
    </p>
    <template v-if="name">
      <p class="sample-path">
        {{ name }} · {{ duration.toFixed(4) }} s · {{ sampleRate.toLocaleString() }} Hz · {{ channels === 1 ? 'Mono' : 'Stereo' }}
      </p>
      <p
        v-if="duration > sampleDurationLimit(channels)"
        class="notice"
      >
        This sample is longer than {{ sampleDurationLimit(channels) }} seconds. Choose a shorter range; audio is not trimmed automatically.
      </p>
      <div class="edit-fields">
        <label>Start (seconds)<input
          :value="start"
          type="number"
          min="0"
          step="any"
          :disabled="disabled"
          @input="$emit('update:start',($event.target as HTMLInputElement).value)"
        ></label>
        <label>End (seconds)<input
          :value="end"
          type="number"
          min="0"
          step="any"
          :disabled="disabled"
          @input="$emit('update:end',($event.target as HTMLInputElement).value)"
        ></label>
        <button
          class="secondary-button"
          :disabled="disabled || busy"
          @click="$emit('prepare')"
        >
          Prepare sample
        </button>
        <button
          class="secondary-button"
          :disabled="disabled || busy || !prepared"
          @click="$emit('preview')"
        >
          Preview converted
        </button>
        <button
          class="secondary-button"
          @click="$emit('stop')"
        >
          Stop preview
        </button>
      </div>
      <p class="muted">
        Maximum {{ sampleDurationLimit(channels) }} seconds. No normalization or fades are applied. Peaks outside the PCM range are clipped. Existing pad settings are retained.
      </p>
      <div class="export-actions">
        <button
          class="primary-button"
          data-action="apply"
          :disabled="disabled || busy || !prepared"
          @click="$emit('apply')"
        >
          Apply to slot {{ slotNumber }}
        </button><button
          class="secondary-button"
          @click="$emit('cancel')"
        >
          Cancel replacement
        </button>
      </div>
    </template>
    <p
      v-if="error"
      role="alert"
      class="error-message"
    >
      {{ error }}
    </p>
    <p class="muted">
      WAV limit: 32 MiB / 60 seconds. Sample replacement exports await device validation.
    </p>
  </section>
</template>
