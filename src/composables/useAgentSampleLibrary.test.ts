// @vitest-environment jsdom
import { expect,it } from 'vitest';
import { useAgentSampleLibrary } from './useAgentSampleLibrary';
it('limits sample access to explicitly selected files and never reuses cleared IDs',async()=>{
 const library=useAgentSampleLibrary();library.add([new File(['wav'],'Kick.wav')]);const first=library.list()[0]!;expect(first).toEqual({id:'sample-1',name:'Kick.wav',size:3});library.clear();library.add([new File(['wav'],'Snare.wav')]);expect(library.list()[0]!.id).not.toBe(first.id);await expect(library.read(first.id)).rejects.toThrow(/no longer/);
});
it('rejects invalid batches atomically and bounds library size',()=>{
 const library=useAgentSampleLibrary();expect(()=>library.add([new File(['x'],'Kick.wav'),new File(['x'],'bad.mp3')])).toThrow();expect(library.list()).toEqual([]);
 expect(()=>library.add(Array.from({length:65},()=>new File(['x'],'Kick.wav')))).toThrow(/64/);
});
