// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ParameterEditor from './ParameterEditor.vue';
it('submits only changed numeric fields and rejects blanks and fractions', async () => {
  const wrapper = mount(ParameterEditor, { props: { values: { level: 56, pan: -53, fxSend: 46 }, disabled: false } });
  await wrapper.get('[name="level"]').setValue('60'); await wrapper.get('form').trigger('submit');
  expect(wrapper.emitted('apply')?.[0]).toEqual([{ level: 60 }]);
  await wrapper.get('[name="level"]').setValue(''); await wrapper.get('form').trigger('submit');
  expect(wrapper.emitted('apply')).toHaveLength(1); expect(wrapper.get('[role="alert"]').text()).toContain('integer');
  await wrapper.get('[name="level"]').setValue('1.5'); await wrapper.get('form').trigger('submit'); expect(wrapper.emitted('apply')).toHaveLength(1);
});
it('updates form when selection changes and blocks submission during import', async () => {
  const wrapper = mount(ParameterEditor, { props: { values: { level: 56, pan: -53, fxSend: 46 }, disabled: false } });
  await wrapper.get('[name="level"]').setValue('80');
  await wrapper.setProps({ values: { level: 75, pan: 0, fxSend: 0 }, disabled: true });
  expect((wrapper.get('[name="level"]').element as HTMLInputElement).value).toBe('75');
  await wrapper.get('form').trigger('submit'); expect(wrapper.emitted('apply')).toBeUndefined();
});
