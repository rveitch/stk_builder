import { expect, it } from 'vitest';
import { registerInspectionTools } from './webMcpAdapter';
import type { InspectionTool } from './inspectionTools';
import { readStk } from '../core/readStk';
import { makeKit } from '../core/testFixtures';
function fakeHost(failAt = -1) {
  const tools = new Map<string, InspectionTool>(); let count = 0;
  return { tools, async registerTool(tool: InspectionTool, options: { signal: AbortSignal }) {
    count += 1; if (count === failAt) throw new Error('registration failed');
    tools.set(tool.name, tool); options.signal.addEventListener('abort', () => tools.delete(tool.name), { once: true });
  } };
}
it('returns live bounded inspection and revokes captured handlers on disable', async () => {
  const host = fakeHost(); let kit = readStk(makeKit([0])); const registration = registerInspectionTools(host, () => kit); await registration.ready;
  expect(host.tools.size).toBe(3); const tool = host.tools.get('getKitSummary')!;
  expect(tool.execute({})).toMatchObject({ populatedSlots: 1 }); kit = readStk(makeKit([0,2]));
  expect(tool.execute({})).toMatchObject({ populatedSlots: 2 }); registration.dispose(); expect(host.tools.size).toBe(0);
  expect(() => tool.execute({})).toThrow(/disabled/);
});
it('cleans up partial registration failure', async () => {
  const host = fakeHost(2); const registration = registerInspectionTools(host, () => null);
  await expect(registration.ready).rejects.toThrow(); expect(host.tools.size).toBe(0);
});
it('rejects absent kits and invalid tool input', async () => {
  const host = fakeHost(); let kit: ReturnType<typeof readStk> | null = null;
  const registration = registerInspectionTools(host, () => kit); await registration.ready;
  expect(() => host.tools.get('getKitSummary')!.execute({})).toThrow(/kit/i);
  kit = readStk(makeKit());
  for (const input of [{slotNumber: 0},{slotNumber: '1'},{slotNumber: 1, path: '/tmp'},null]) expect(() => host.tools.get('getSlotDetails')!.execute(input)).toThrow();
  const result = host.tools.get('getSlotDetails')!.execute({slotNumber: 1}); expect(JSON.stringify(result)).not.toContain('rawRecord'); registration.dispose();
});
it('cancels registration still in flight', async () => {
  let finish!: () => void; let captured: InspectionTool | undefined; let signal: AbortSignal | undefined;
  const host = { registerTool(tool: InspectionTool, options: {signal: AbortSignal}) { captured = tool; signal = options.signal; return new Promise<void>(resolve => { finish = resolve; }); } };
  const registration = registerInspectionTools(host, () => readStk(makeKit())); registration.dispose(); finish(); await registration.ready;
  expect(signal?.aborted).toBe(true); expect(() => captured!.execute({})).toThrow(/disabled/);
});
