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
        title="Remove sample and restore default pad settings"
        :disabled="disabled"
        @click="$emit('clear')"
      >
        Clear pad
      </button>
    </div>

    <h3>Pad color <span class="muted">{{ color ?? 'Unknown' }} / 30</span></h3>
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
