<script setup lang="ts">
import { ref } from 'vue';
defineProps<{ loading: boolean; compact: boolean }>();
const emit = defineEmits<{ import: [file: File] }>();
const dragging = ref(false);
function selected(event: Event) { const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (file) emit('import', file); input.value = ''; }
function dropped(event: DragEvent) { dragging.value = false; const file = event.dataTransfer?.files[0]; if (file) emit('import', file); }
</script>
<template>
  <section
    class="import-area"
    :class="{ dragging, compact }"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="dropped"
  >
    <div>
      <span
        v-if="!compact"
        class="eyebrow"
      >START WITH A KIT</span><h2>{{ compact ? 'Open another kit' : 'Your sounds. In their place.' }}</h2><p>Drop a SmplTrek .stk file here, or choose one to explore.</p>
    </div>
    <label class="primary-button file-button">{{ loading ? 'Reading kit…' : 'Open STK file' }}<input
      type="file"
      accept=".stk"
      aria-label="Open STK file"
      @change="selected"
    ></label>
    <small>Local processing · Up to 64 MiB · Originals stay unchanged</small>
  </section>
</template>
