<script setup lang="ts">
import type { Kit } from '../core/types';
import { padRows, suggestedPadTypes } from '../presentation/padLayout';
import { getPadColor } from '../presentation/padPalette';
defineProps<{ kit: Kit | null; selectedSlot: number; busySlots?: number[] }>();
const emit = defineEmits<{ select: [slot: number]; sample: [slot: number, file: File] }>();
function dropSample(slot: number, event: DragEvent) { const file=event.dataTransfer?.files[0]; if (file) emit('sample',slot,file); }
</script>
<template>
  <div
    class="pad-scroll"
    role="group"
    aria-label="SmplTrek sample slots"
  >
    <div class="pad-board">
      <div
        v-for="(row, index) in padRows"
        :key="index"
        class="pad-row"
        :class="{ upper: index === 0 }"
      >
        <button
          v-for="number in row"
          :key="number"
          class="pad"
          :class="{ selected: kit && selectedSlot === number, empty: !kit?.slots[number - 1]?.sample }"
          :data-slot="number"
          :aria-describedby="`pad-suggestion-${number}`"
          :aria-pressed="Boolean(kit && selectedSlot === number)"
          :aria-label="`Slot ${number}: ${kit?.slots[number - 1]?.path.split('/').at(-1) || 'Empty'}`"
          :style="{ '--pad-color': getPadColor(kit?.slots[number - 1]?.parameters.colorCode ?? 0).hex }"
          @click="$emit('select', number)"
          @dragover.prevent
          @drop.prevent.stop="dropSample(number, $event)"
        >
          <span class="pad-number">{{ String(number).padStart(2, '0') }}</span>
          <span class="pad-name">{{ kit?.slots[number - 1]?.path.split('/').at(-1)?.replace(/\.wav$/i, '') || 'Empty' }}</span>
          <span class="pad-status">{{ busySlots?.includes(number) ? 'CONVERTING…' : kit?.slots[number - 1]?.sample ? 'SAMPLE' : 'DROP WAV' }}</span>
          <span
            :id="`pad-suggestion-${number}`"
            class="pad-suggestion"
          ><span class="sr-only">Suggested type: </span>{{ suggestedPadTypes[number] }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
