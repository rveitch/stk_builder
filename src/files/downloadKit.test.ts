// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { downloadKit } from './downloadKit';
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
it('downloads exact bytes under a separate sanitized STK filename and releases URL', async () => {
  vi.useFakeTimers(); const create = vi.fn<(blob: Blob) => string>().mockReturnValue('blob:test'); const revoke = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
  let name = ''; vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { name = this.download; });
  const bytes = new Uint8Array([1, 2, 255]); downloadKit(bytes, '../Rock kit.stk', true);
  expect(name).toBe('Rock kit-edited.stk'); expect(create.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
  expect((create.mock.calls[0] as unknown as [Blob])[0].size).toBe(3);
  expect(revoke).not.toHaveBeenCalled(); await vi.runAllTimersAsync(); expect(revoke).toHaveBeenCalledWith('blob:test');
  expect(document.querySelector('a[download]')).toBeNull();
});
