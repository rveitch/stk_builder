import { shallowRef } from 'vue';
import { maxWavImportBytes } from '../core/sampleAudio';
export function useAgentSampleLibrary() {
  const entries=shallowRef<{id:string;file:File}[]>([]);let nextId=0;
  function add(files:File[]) {
    if(entries.value.length+files.length>64)throw new Error('Select at most 64 library samples.');
    if(files.some(file=>file.size>maxWavImportBytes||!file.name.toLowerCase().endsWith('.wav')))throw new Error('Choose WAV files up to 32 MiB each.');
    if([...entries.value.map(entry=>entry.file),...files].reduce((sum,file)=>sum+file.size,0)>128*1024*1024)throw new Error('Sample library limit is 128 MiB.');
    entries.value=[...entries.value,...files.map(file=>{nextId+=1;return{id:`sample-${nextId}`,file};})];
  }
  function list(){return entries.value.map(({id,file})=>({id,name:file.name,size:file.size}));}
  async function read(id:string){const entry=entries.value.find(item=>item.id===id);if(!entry)throw new Error('Sample is no longer in the library.');const bytes=new Uint8Array(await entry.file.arrayBuffer());if(!entries.value.includes(entry))throw new Error('Sample library changed.');return{name:entry.file.name,bytes};}
  function clear(){entries.value=[];}
  return {entries,add,list,read,clear};
}
