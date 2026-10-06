<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { parameterLimits, type EditableParameter, type SlotEdit } from '../core/writeStk';
const props = defineProps<{ values: Record<EditableParameter, number>; disabled: boolean }>();
const emit = defineEmits<{ apply: [values: SlotEdit['values']] }>();
const fields: { key: EditableParameter; label: string }[] = [{ key: 'level', label: 'Level' }, { key: 'pan', label: 'Pan' }, { key: 'fxSend', label: 'FX send' }];
const draft = reactive({ level: '', pan: '', fxSend: '' }); const error = ref('');
watch(() => props.values, values => { for (const { key } of fields) draft[key] = String(values[key]); error.value = ''; }, { immediate: true });
function apply() {
  if (props.disabled) return;
  error.value = ''; const values: SlotEdit['values'] = {};
  for (const { key, label } of fields) {
    if (draft[key] === String(props.values[key])) continue;
    const value = Number(draft[key]); const { min, max } = parameterLimits[key];
    if (!draft[key].trim() || !Number.isInteger(value) || value < min || value > max) { error.value = `${label} must be an integer from ${min} to ${max}.`; return; }
    values[key] = value;
  }
  if (Object.keys(values).length) emit('apply', values);
}
</script>
<template>
  <form
    class="parameter-editor"
    novalidate
    @submit.prevent="apply"
  >
    <fieldset :disabled="disabled">
      <legend>Sound settings</legend>
      <div class="edit-fields">
        <label
          v-for="field in fields"
          :key="field.key"
        >
          {{ field.label }}
          <input
            :value="draft[field.key]"
            :name="field.key"
            type="number"
            step="1"
            :min="parameterLimits[field.key].min"
            :max="parameterLimits[field.key].max"
            @input="draft[field.key] = ($event.target as HTMLInputElement).value"
          >
        </label>
        <button
          class="secondary-button"
          type="submit"
        >
          Apply settings
        </button>
      </div>
    </fieldset>
    <p class="muted">
      Pan: L53 (−53) to R53 (53), center 0. Apply changes before switching pads.
    </p>
    <p
      v-if="error"
      role="alert"
      class="error-message"
    >
      {{ error }}
    </p>
  </form>
</template>
