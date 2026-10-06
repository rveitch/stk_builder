// @vitest-environment jsdom
import { expect,it } from 'vitest';import { mount } from '@vue/test-utils';import PadEditor from './PadEditor.vue';
it('exposes name, all30 colors and clear independently of sample preview',async()=>{
 const wrapper=mount(PadEditor,{props:{name:'Kick',populated:true,color:1,disabled:false}});
 await wrapper.get('[aria-label="Sample name"]').setValue('Bass Drum');expect(wrapper.emitted('rename')?.[0]).toEqual(['Bass Drum']);
 await wrapper.get('[aria-label="Color 30"]').trigger('click');expect(wrapper.emitted('color')?.[0]).toEqual([30]);expect(wrapper.findAll('[data-color]')).toHaveLength(30);
 await wrapper.get('[data-action="clear"]').trigger('click');expect(wrapper.emitted('clear')).toHaveLength(1);
});
