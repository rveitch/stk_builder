import { validateName } from '../core/kitEditing';
import { computed, shallowReactive } from 'vue';
import { decodeWav, maxWavImportBytes, type PcmAudio } from '../core/sampleAudio';
import { convertSample } from '../audio/convertSample';
export interface PadSampleEntry { name:string; source:PcmAudio|null; duration:number; start:number; end:number; trimmed:boolean; busy:boolean; error:string }
/** Jobs are serialized to bound decode memory; each retains its destination pad. */
export function usePadSamples(apply:(slot:number,bytes:Uint8Array,name:string)=>void,convert:typeof convertSample=convertSample){
 const entries=shallowReactive(new Map<number,PadSampleEntry>());const tokens=new Map<number,number>();let epoch=0;let queue=Promise.resolve();
 const busy=computed(()=>[...entries.values()].some(entry=>entry.busy));
 function rename(slot:number,name:string){const entry=entries.get(slot);if(entry)entries.set(slot,{...entry,name:validateName(name)+'.wav'});}
 function cancel(slot:number){tokens.set(slot,(tokens.get(slot)??0)+1);entries.delete(slot);}
 function clear(){epoch+=1;tokens.clear();entries.clear();}
 function retainSource(slot:number){
  let retained=0;const order=[slot,...[...entries.keys()].filter(key=>key!==slot).reverse()];
  for(const key of order){const entry=entries.get(key)!;if(!entry.source)continue;const size=entry.source.channels.reduce((sum,ch)=>sum+ch.byteLength,0);if(retained+size>128*1024*1024)entries.set(key,{...entry,source:null});else retained+=size;}
 }
 function enqueue(slot:number,job:(valid:()=>boolean)=>Promise<void>){
  const currentEpoch=epoch;const token=(tokens.get(slot)??0)+1;tokens.set(slot,token);
  const valid=()=>epoch===currentEpoch&&tokens.get(slot)===token;
  const result=queue.then(async()=>{if(!valid())return;try{await job(valid);}catch(cause){if(valid()){const entry=entries.get(slot);if(entry)entries.set(slot,{...entry,busy:false,error:cause instanceof Error?cause.message:'Unable to assign sample.'});}}});
  queue=result;return result;
 }
 function assign(slot:number,file:Pick<File,'name'|'size'|'arrayBuffer'>){
  entries.set(slot,{name:file.name,source:null,duration:0,start:0,end:0,trimmed:false,busy:true,error:''});
  return enqueue(slot,async valid=>{
   if(file.size>maxWavImportBytes)throw new Error('WAV import limit is 32 MiB.');
   const buffer=await file.arrayBuffer();if(!valid())return;const source=decodeWav(new Uint8Array(buffer));const duration=source.channels[0]!.length/source.sampleRate;const end=Math.min(duration,2.7);
   const entry:PadSampleEntry={name:file.name,source,duration,start:0,end,trimmed:duration>2.7,busy:true,error:''};entries.set(slot,entry);retainSource(slot);
   const bytes=await convert(source,0,end);if(!valid())return;apply(slot,bytes,file.name);entries.set(slot,{...entry,busy:false});retainSource(slot);
  });
 }
 function adjust(slot:number,startText:string,endText:string){
  const entry=entries.get(slot);if(!entry)return Promise.resolve();entries.set(slot,{...entry,busy:true,error:''});
  return enqueue(slot,async valid=>{
   if(!entry.source)throw new Error('Choose the original WAV again to adjust its trim.');
   if(!startText.trim()||!endText.trim())throw new Error('Enter both trim times.');
   const start=Number(startText);const end=Number(endText);const bytes=await convert(entry.source,start,end);if(!valid())return;
   apply(slot,bytes,entry.name);entries.set(slot,{...entry,start,end,trimmed:start>0||end<entry.duration,busy:false,error:''});
  });
 }
 return {entries,busy,assign,adjust,rename,cancel,clear};
}
