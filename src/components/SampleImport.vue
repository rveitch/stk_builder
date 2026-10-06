<script setup lang="ts">
import { ref,watch } from 'vue';
import type { PadSampleEntry } from '../composables/usePadSamples';
import { sampleDurationLimit } from '../core/sampleAudio';
const props=defineProps<{slotNumber:number;entry?:PadSampleEntry;disabled:boolean}>();
const emit=defineEmits<{file:[file:File];trim:[start:string,end:string]}>();
const start=ref('0');const end=ref('0');
watch(()=>[props.slotNumber,props.entry?.start,props.entry?.end],()=>{start.value=String(props.entry?.start??0);end.value=String(props.entry?.end??0);},{immediate:true});
function choose(event:Event){const input=event.target as HTMLInputElement;const file=input.files?.[0];if(file)emit('file',file);input.value='';}
</script>
<template>
  <section class="sample-import">
    <header class="detail-heading">
      <div><span class="eyebrow">ASSIGN SAMPLE</span><h3>Drop a WAV onto pad {{ slotNumber }}</h3></div><label class="primary-button file-button">Choose WAV<input
        type="file"
        accept=".wav,audio/wav"
        aria-label="Choose WAV"
        :disabled="disabled"
        @change="choose"
      ></label>
    </header>
    <p class="muted">
      Converts and assigns automatically. Longer samples use the first 2.7 seconds; adjust the trim below.
    </p>
    <p
      v-if="entry?.busy"
      role="status"
    >
      Converting sample for pad {{ slotNumber }}…
    </p>
    <p
      v-if="entry?.error"
      role="alert"
      class="error-message"
    >
      {{ entry.error }}
    </p>
    <template v-if="entry && !entry.busy">
      <p
        v-if="entry.trimmed && !entry.error"
        class="notice"
        role="status"
      >
        Sample is too long for the default range. Assigned {{ entry.start }}–{{ entry.end }} s of {{ entry.duration.toFixed(3) }} s. The original file is unchanged.
      </p>
      <p
        v-else-if="!entry.error"
        class="muted"
      >
        Sample assigned. Use the pad preview to listen.
      </p>
      <details v-if="entry.source">
        <summary>Adjust trim</summary><div class="edit-fields">
          <label>Start (seconds)<input
            v-model="start"
            type="number"
            min="0"
            step="any"
            :disabled="disabled"
          ></label><label>End (seconds)<input
            v-model="end"
            type="number"
            min="0"
            step="any"
            :disabled="disabled"
          ></label><button
            class="secondary-button"
            :disabled="disabled"
            @click="$emit('trim',String(start),String(end))"
          >
            Update trim
          </button>
        </div><p class="muted">
          Maximum {{ sampleDurationLimit(entry.source.channels.length) }} seconds for this sample. Updates convert and apply automatically.
        </p>
      </details>
      <p
        v-else-if="!entry.error"
        class="muted"
      >
        Original audio released from memory. Choose the WAV again to adjust its trim.
      </p>
    </template>
  </section>
</template>
