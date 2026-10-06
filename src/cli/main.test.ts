import { afterEach, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from './main';
import { encodePcm16 } from '../core/sampleAudio';
const folders:string[]=[];
afterEach(async()=>{for(const folder of folders)await rm(folder,{recursive:true,force:true});folders.length=0;});
it('creates a single-folder kit and machine-readable report without overwriting it',async()=>{
  const root=await mkdtemp(join(tmpdir(),'stk-main-'));folders.push(root);
  const input=join(root,'input');const output=join(root,'output');await mkdir(input);
  await writeFile(join(input,'Kick.wav'),encodePcm16([new Float32Array([0,0.25,-0.25])]));
  const args=['--input',input,'--output',output,'--name','Demo'];await main(args);
  const manifest=JSON.parse(await readFile(join(output,'manifest.json'),'utf8'));
  expect(manifest.kits).toBe(1);expect(manifest.samples).toBe(1);expect(manifest.errors).toEqual([]);
  expect(manifest.results[0].samples[0].slot).toBe(1);
  await expect(main(args)).rejects.toThrow();
  expect(JSON.parse(await readFile(join(output,'manifest.json'),'utf8'))).toEqual(manifest);
});
it('reports a failed input without silently dropping it',async()=>{
  const root=await mkdtemp(join(tmpdir(),'stk-main-'));folders.push(root);
  const input=join(root,'input');const output=join(root,'output');await mkdir(input);
  await writeFile(join(input,'Broken.wav'),'not a WAV');
  await expect(main(['--input',input,'--output',output,'--name','Broken'])).rejects.toThrow(/failed/);
  const manifest=JSON.parse(await readFile(join(output,'manifest.json'),'utf8'));
  expect(manifest.kits).toBe(0);expect(manifest.errors).toHaveLength(1);
});
