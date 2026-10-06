import { createInspectionTools, type InspectionTool } from './inspectionTools';
import type { Kit } from '../core/types';
// Current WebMCP draft: document.modelContext, async registration and signal cleanup.
// https://webmachinelearning.github.io/webmcp/ (verified 2026-10-06)
export interface WebMcpHost { registerTool(tool: InspectionTool, options: { signal: AbortSignal }): Promise<void> | void }
export function getWebMcpHost(): WebMcpHost | null {
  if (typeof document === 'undefined') return null;
  const host = (document as Document & { modelContext?: WebMcpHost }).modelContext;
  return host && typeof host.registerTool === 'function' ? host : null;
}
export function registerInspectionTools(host: WebMcpHost, getKit: () => Kit | null) {
  const controller = new AbortController();
  const tools = createInspectionTools(() => { if (controller.signal.aborted) throw new Error('Agent assistance is disabled.'); return getKit(); });
  async function register() {
    try {
      for (const tool of tools) { if (controller.signal.aborted) break; await host.registerTool(tool, { signal: controller.signal }); }
    } catch (error) { controller.abort(); throw error; }
  }
  return { ready: register(), dispose() { controller.abort(); } };
}
