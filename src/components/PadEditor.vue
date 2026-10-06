<script setup lang="ts">
import { getPadColor } from '../presentation/padPalette';
defineProps<{name:string;populated:boolean;color:number|null;disabled:boolean}>();
defineEmits<{rename:[name:string];color:[color:number];clear:[]}>();
</script>
<template>
  <section class="pad-editor">
    <div class="edit-fields">
      <label>Sample name<input
        :value="name"
        aria-label="Sample name"
        maxlength="48"
        :disabled="disabled || !populated"
        @change="$emit('rename',($event.target as HTMLInputElement).value)"
      ></label><button
        class="secondary-button"
        data-action="clear"
        :disabled="disabled"
        @click="$emit('clear')"
      >
        Clear pad
      </button>
    </div>
    <p class="muted">
      Clear removes audio and restores default pad settings. Names use letters, numbers, spaces, hyphens and underscores.
    </p>
    <h3>Pad color <span class="muted">{{ color ?? 'Unknown' }} / 30 · device mapping unverified</span></h3>
    <div
      class="color-grid"
      role="group"
      aria-label="Pad colors"
    >
      <button
        v-for="number in 30"
        :key="number"
        :data-color="number"
        :aria-label="`Color ${number}`"
        :aria-pressed="color === number"
        :disabled="disabled"
        :style="{'--swatch':getPadColor(number - 1).hex}"
        @click="$emit('color',number)"
      >
        {{ number }}
      </button>
    </div>
  </section>
</template>
