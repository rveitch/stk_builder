import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createKit, validateName } from '../core/kitEditing';
import { planSlots } from '../core/planSlots';
import { decodeWav, trimAudio, encodePcm16 } from '../core/sampleAudio';
import { replaceSample } from '../core/replaceSample';
import { readStk } from '../core/readStk';

export async function buildFolder(folder:string, name:string) {
  validateName(name);
  const entries=await readdir(folder,{withFileTypes:true});
  const filenames=entries.filter(entry=>entry.isFile() && /\.wav$/i.test(entry.name)).map(entry=>entry.name);
  if (!filenames.length) throw new Error(`No WAV samples in ${folder}`);
  const assignments=planSlots(filenames);
  let kit=createKit();
  const samples=[];
  for (const assignment of assignments) {
    const source=await readFile(join(folder,assignment.filename));
    const audio=decodeWav(source);
    if (audio.sampleRate!==48000) throw new Error(`${assignment.filename}: CLI currently requires 48 kHz WAV; resample the source before importing.`);
    const sourceSeconds=audio.channels[0]!.length/audio.sampleRate;
    const outputSeconds=Math.min(sourceSeconds,2.7);
    const wav=encodePcm16(trimAudio(audio,0,outputSeconds).channels);
    kit=readStk(replaceSample(kit,assignment.slot,wav,assignment.filename));
    const embedded=kit.slots[assignment.slot-1]!.sample!;
    if (!Buffer.from(embedded.bytes).equals(Buffer.from(wav))) throw new Error(`Embedded audio mismatch: ${assignment.filename}`);
    samples.push({...assignment,sourceSeconds,outputSeconds,trimmed:sourceSeconds>2.7,
      sourceSha256:createHash('sha256').update(source).digest('hex'),
      embeddedSha256:createHash('sha256').update(wav).digest('hex'),
      color:kit.slots[assignment.slot-1]!.parameters.colorCode+1});
  }
  if (kit.diagnostics.length) throw new Error(`STK validation failed: ${JSON.stringify(kit.diagnostics)}`);
  if (kit.slots.filter(slot=>slot.sample).length!==filenames.length) throw new Error('Sample count mismatch.');
  return {name,bytes:kit.source,samples};
}
/** Exclusive creation prevents accidental replacement of existing user kits. */
export async function saveKit(path:string, bytes:Uint8Array) {
  await writeFile(path,bytes,{flag:'wx'});
  const saved=await readFile(path);
  if (!saved.equals(Buffer.from(bytes)) || readStk(saved).diagnostics.length) throw new Error(`Saved file verification failed: ${path}`);
}
