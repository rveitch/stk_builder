<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import type { KitAgentContext, AgentSample } from '../agents/kitTools';
import type { Kit } from '../core/types';
import { getWebMcpHost, registerInspectionTools } from '../agents/webMcpAdapter';
const props = defineProps<{ kit: Kit | null; context: KitAgentContext; samples: AgentSample[] }>();
const emit=defineEmits<{addSamples:[files:File[]];clearSamples:[]}>();
function chooseSamples(event:Event){const input=event.target as HTMLInputElement;emit('addSamples',Array.from(input.files??[]));input.value='';}
const enabled = ref(false); const pending = ref(false); const message = ref('Off. Your kit is only available in this editor.');
let registration: ReturnType<typeof registerInspectionTools> | undefined;
async function toggle() {
  if (enabled.value || pending.value) { registration?.dispose(); registration = undefined; enabled.value = false; pending.value = false; message.value = 'Agent access disabled.'; return; }
  const host = getWebMcpHost(); if (!host) { message.value = 'WebMCP is unavailable in this browser. The kit editor works normally.'; return; }
  pending.value = true; const current = registerInspectionTools(host, () => props.kit, props.context); registration = current;
  try { await current.ready; if (registration === current) { enabled.value = true; message.value = 'Agent kit-building tools are enabled. Changes appear immediately in the editor.'; } }
  catch { if (registration === current) { message.value = 'Could not enable WebMCP in this browser. Agent access remains off.'; registration = undefined; } }
  finally { if (registration === current || !registration) pending.value = false; }
}
onBeforeUnmount(() => registration?.dispose());
</script>
<template>
  <section class="agent-panel">
    <div>
      <span class="eyebrow">OPTIONAL / EXPERIMENTAL</span><h3>Build with an AI agent</h3><p>Enable WebMCP so a connected agent can create and name kits, assign your selected WAVs to pads, and edit names, colors, level, pan, and FX send. Audio stays local. You can review, reset, and export the result in the editor.</p><p role="status">
        {{ message }}
      </p>
      <div class="agent-library-controls">
        <label class="secondary-button file-button">Add WAVs for agent<input
          type="file"
          multiple
          accept=".wav,audio/wav"
          aria-label="Add WAVs for agent"
          @change="chooseSamples"
        ></label><span class="muted">{{ samples.length }} samples available</span><button
          v-if="samples.length"
          class="secondary-button"
          @click="$emit('clearSamples')"
        >
          Clear library
        </button>
      </div>
      <details
        v-if="samples.length"
        class="agent-library-list"
      >
        <summary>Available samples</summary><ul>
          <li
            v-for="sample in samples"
            :key="sample.id"
          >
            {{ sample.name }}
          </li>
        </ul>
      </details>
    </div><button
      class="secondary-button"
      :aria-pressed="enabled"
      @click="toggle"
    >
      {{ enabled || pending ? 'Disable agent access' : 'Enable agent access' }}
    </button>
  </section>
</template>
