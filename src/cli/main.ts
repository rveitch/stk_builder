import { mkdir, readdir, writeFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { buildFolder, saveKit } from './buildKit';
import { validateName } from '../core/kitEditing';

export async function main(args:string[]) {
  const {values}=parseArgs({args,options:{input:{type:'string'},output:{type:'string'},name:{type:'string'},'loud-foundry':{type:'boolean'},help:{type:'boolean'}}});
  if (values.help) {
    console.log('STK Builder CLI\n\nSingle folder: npm run cli -- --input <WAV folder> --output <new output folder> --name <kit name>\n60-kit batch: npm run cli -- --loud-foundry --input <Loud Foundry root> --output <new output folder>\n\nUses direct WAV files in each kit folder, reserves template slots, retains extras, converts 48 kHz PCM/float WAVs to PCM16, and trims to 2.7 s. Existing output folders are never overwritten.');
    return;
  }
  if (!values.input || !values.output) throw new Error('Supply --input and --output. See --help.');
  const input=resolve(values.input);const output=resolve(values.output);
  const jobs:{folder:string;name:string;subfolder:string}[]=[];
  if (values['loud-foundry']) {
    for (let volume=1;volume<=3;volume+=1) {
      const root=join(input,`LF - Dark Cyberpunk Construction Kits Vol. ${volume}`,'Kits');
      const entries=await readdir(root,{withFileTypes:true});
      const kits=entries.filter(entry=>entry.isDirectory()&&/^Kit \d{2}$/.test(entry.name));
      if(kits.length!==20) throw new Error(`Expected 20 kit folders in ${root}, found ${kits.length}.`);
      for(let number=1;number<=20;number+=1) {
        const padded=String(number).padStart(2,'0');
        const folder=join(root,`Kit ${padded}`);await access(folder);
        jobs.push({folder,name:`LFDCP${volume}_Kit_${padded}`,subfolder:`Volume ${volume}`});
      }
    }
  } else {
    if (!values.name) throw new Error('Single-folder conversion requires --name.');
    jobs.push({folder:input,name:validateName(values.name),subfolder:''});
  }
  // Refuse existing destination before any output is written, including prior reports.
  await mkdir(output,{recursive:false});
  const reports=[];
  const errors=[];
  for(const job of jobs) {
    try {
      const result=await buildFolder(job.folder,job.name);
      const directory=join(output,job.subfolder);await mkdir(directory,{recursive:true});
      const path=join(directory,`${job.name}.stk`);await saveKit(path,result.bytes);
      reports.push({name:job.name,input:job.folder,output:path,bytes:result.bytes.length,sha256:createHash('sha256').update(result.bytes).digest('hex'),samples:result.samples});
      console.log(`${job.name}: ${result.samples.length} samples, ${result.samples.filter(sample=>sample.trimmed).length} trimmed`);
    } catch(error) {
      const message=error instanceof Error ? error.message : String(error);
      errors.push({name:job.name,message});console.error(`${job.name}: ${message}`);
    }
  }
  const sampleCount=reports.reduce((sum,kit)=>sum+kit.samples.length,0);
  const trims=reports.flatMap(kit=>kit.samples.filter(sample=>sample.trimmed).map(sample=>({kit:kit.name,...sample})));
  const report={createdAt:new Date().toISOString(),kits:reports.length,samples:sampleCount,trimmed:trims.length,errors,results:reports};
  await writeFile(join(output,'manifest.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  const lines=['# Loud Foundry STK conversion', '',`${reports.length} kits, ${sampleCount} samples, ${trims.length} trimmed samples, ${errors.length} errors.`, '',
    'Converted locally using STK Builder. Every input WAV in each Kits/Kit folder is assigned once. Tonal one-shots, loops, stems, and duplicate source folders are outside the drum-kit input set.',
    'Output: 48 kHz / 16-bit PCM; original channel count retained. Level 100, centered pan, FX send 0, preferred slot colors. Source files unchanged.',
    'Hi_Hat_01 is treated as open and Hi_Hat_02 as closed when both exist. Named Open_Hat takes priority for slot 9. Extras occupy suitable free slots. Colors and fresh-kit defaults still need device validation.', '', '## Trimmed samples', '',
    ...trims.map(sample=>`- ${sample.kit}, slot ${sample.slot}, ${sample.filename}: ${sample.sourceSeconds.toFixed(3)} s to ${sample.outputSeconds.toFixed(3)} s (from the start).`),
    ...(!trims.length?['None.']:[]),'','## Slot assignments','',
    ...reports.flatMap(kit=>[`### ${kit.name}`,'',...kit.samples.map(sample=>`- Slot ${sample.slot}: ${sample.filename}${sample.trimmed?' (trimmed)':''}`),'']),
    '## Errors','',...errors.map(error=>`- ${error.name}: ${error.message}`),...(!errors.length?['None.']:[])];
  await writeFile(join(output,'Conversion Report.md'),lines.join('\n')+'\n',{flag:'wx'});
  console.log(`Saved ${reports.length}/${jobs.length} kits (${sampleCount} samples) to ${output}`);
  if (errors.length) throw new Error(`${errors.length} kits failed; see manifest.json.`);
}
