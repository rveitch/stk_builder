// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PadGrid from './PadGrid.vue';
import SlotDetails from './SlotDetails.vue';
import { readStk } from '../core/readStk';
import { makeKit } from '../core/testFixtures';
import { getSlotDetails } from '../core/inspectKit';
it('renders physical slot order and allows selecting an empty pad', async () => {
  const kit = readStk(makeKit()); const wrapper = mount(PadGrid, { props: { kit, selectedSlot: 1 } });
  const buttons = wrapper.findAll('button'); expect(buttons.map(b => b.attributes('data-slot'))).toEqual(['2','4','6','8','10','12','14','1','3','5','7','9','11','13','15']);
  await buttons[0]!.trigger('click'); expect(wrapper.emitted('select')?.[0]).toEqual([2]);
});
it('labels provisional fields and disables preview for empty slots', () => {
  const kit = readStk(makeKit()); const wrapper = mount(SlotDetails, { props: { details: getSlotDetails(kit, 2), playing: false, busy: false } });
  expect(wrapper.text()).toContain('Unverified'); expect(wrapper.find('button').attributes('disabled')).toBeDefined();
});
it('renders filenames as text and distinguishes unsupported audio', () => {
  const kit = readStk(makeKit()); kit.slots[0]!.path = '<img src=x onerror=alert(1)>';
  kit.slots[0]!.sample!.info.previewSupported = false;
  const wrapper = mount(SlotDetails, { props: { details: getSlotDetails(kit, 1), playing: false, busy: false } });
  expect(wrapper.find('img').exists()).toBe(false); expect(wrapper.text()).toContain('Preview unavailable');
});

it('imports dropped files through the same public file event', async () => {
  const { default: KitImport } = await import('./KitImport.vue');
  const wrapper = mount(KitImport, { props: { loading: false, compact: false } });
  const file = new File([new Uint8Array([1,2,3])], 'drop.stk');
  await wrapper.find('section').trigger('drop', { dataTransfer: { files: [file] } });
  expect(wrapper.emitted('import')?.[0]?.[0]).toBe(file);
});
it('keeps agent access off when the browser does not support WebMCP', async () => {
  const { default: AgentAccess } = await import('./AgentAccess.vue');
  const kit=readStk(makeKit());
  const wrapper = mount(AgentAccess, { props: { kit, samples:[], context:{getState:()=>({kit,name:'Test',revision:0,busy:false}),listSamples:()=>[],readSample:async()=>{throw new Error('No samples');},commit:()=>{}} } });
  await wrapper.find('button').trigger('click');
  expect(wrapper.text()).toContain('unavailable');
  expect(wrapper.find('button').attributes('aria-pressed')).toBe('false');
});
