// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import SampleImport from './SampleImport.vue';
import PadGrid from './PadGrid.vue';
import { readStk } from '../core/readStk';
import { makeKit } from '../core/testFixtures';
it('routes a dropped WAV to the exact pad', async () => {
  const wrapper=mount(PadGrid,{props:{kit:readStk(makeKit()),selectedSlot:1}}); const file=new File(['audio'],'kick.wav');
  await wrapper.get('[data-slot="3"]').trigger('drop',{dataTransfer:{files:[file]}});
  expect(wrapper.emitted('sample')?.[0]).toEqual([3,file]);
});
it('disables apply until a converted sample exists and describes overlong sources', () => {
  const wrapper=mount(SampleImport,{props:{slotNumber:3,name:'long.wav',duration:6,channels:1,sampleRate:44100,start:'0',end:'6',busy:false,prepared:false,error:'',disabled:false}});
  expect(wrapper.get('[data-action="apply"]').attributes('disabled')).toBeDefined(); expect(wrapper.text()).toContain('5.4'); expect(wrapper.text()).toContain('not trimmed automatically');
});
