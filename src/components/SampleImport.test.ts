// @vitest-environment jsdom
import { expect,it } from 'vitest';import { mount } from '@vue/test-utils';import SampleImport from './SampleImport.vue';import PadGrid from './PadGrid.vue';import { createKit } from '../core/kitEditing';
it('routes WAV drop onto an empty new-kit pad',async()=>{
 const wrapper=mount(PadGrid,{props:{kit:createKit(),selectedSlot:1}});const file=new File(['audio'],'kick.wav');await wrapper.get('[data-slot="3"]').trigger('drop',{dataTransfer:{files:[file]}});expect(wrapper.emitted('sample')?.[0]).toEqual([3,file]);
});
it('shows automatic truncation with one trim update and no preparation/apply controls',()=>{
 const wrapper=mount(SampleImport,{props:{slotNumber:3,disabled:false,entry:{name:'long.wav',duration:6,start:0,end:2.7,trimmed:true,busy:false,error:'',source:{sampleRate:48000,channels:[new Float32Array(1)]}}}});
 expect(wrapper.text()).toContain('2.7');expect(wrapper.text()).toContain('Adjust trim');expect(wrapper.text()).not.toContain('Prepare sample');expect(wrapper.text()).not.toContain('Apply to slot');
});
it('keeps trim controls available to correct a rejected range', async()=>{
 const wrapper=mount(SampleImport,{props:{slotNumber:1,disabled:false,entry:{name:'long.wav',duration:6,start:0,end:2.7,trimmed:true,busy:false,error:'Enter both trim times.',source:{sampleRate:48000,channels:[new Float32Array(1)]}}}});
 expect(wrapper.get('[role="alert"]').text()).toContain('times');
 await wrapper.get('input[type="number"]').setValue('1');
 await wrapper.get('button').trigger('click');
 expect(wrapper.emitted('trim')?.[0]).toEqual(['1','2.7']);
});
