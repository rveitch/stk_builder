<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import type { Kit } from '../core/types';
import { getWebMcpHost, registerInspectionTools } from '../agents/webMcpAdapter';
const props = defineProps<{ kit: Kit | null }>();
const enabled = ref(false); const pending = ref(false); const message = ref('Off. Your kit is only available in this editor.');
let registration: ReturnType<typeof registerInspectionTools> | undefined;
async function toggle() {
  if (enabled.value || pending.value) { registration?.dispose(); registration = undefined; enabled.value = false; pending.value = false; message.value = 'Agent access disabled.'; return; }
  const host = getWebMcpHost(); if (!host) { message.value = 'WebMCP is unavailable in this browser. The kit inspector works normally.'; return; }
  pending.value = true; const current = registerInspectionTools(host, () => props.kit); registration = current;
  try { await current.ready; if (registration === current) { enabled.value = true; message.value = 'Three read-only inspection tools are available to connected agents.'; } }
  catch { if (registration === current) { message.value = 'Could not enable WebMCP in this browser. Agent access remains off.'; registration = undefined; } }
  finally { if (registration === current || !registration) pending.value = false; }
}
onBeforeUnmount(() => registration?.dispose());
</script>
<template>
  <section class="agent-panel">
    <div>
      <span class="eyebrow">OPTIONAL / EXPERIMENTAL</span><h3>Explore with an AI agent</h3><p>Enable WebMCP to share kit metadata and sample paths with a connected agent. Audio stays in the browser. These tools cannot edit your kit.</p><p role="status">
        {{ message }}
      </p>
    </div><button
      class="secondary-button"
      :aria-pressed="enabled"
      @click="toggle"
    >
      {{ enabled || pending ? 'Disable agent access' : 'Enable agent access' }}
    </button>
  </section>
</template>
