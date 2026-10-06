import { readStk } from './readStk';
import { readUint32 } from './binary';
import { canEditKit } from './writeStk';
import type { Kit } from './types';
export function createKit(): Kit {
 const bytes=new Uint8Array(4244);const view=new DataView(bytes.buffer);const encoder=new TextEncoder();
 bytes.set(encoder.encode('VDK0'));view.setUint32(4,4244,true);view.setUint32(12,1,true);bytes.set(encoder.encode('KTDT'),16);view.setUint32(20,4228,true);view.setUint32(28,1,true);
 for(let index=0;index<15;index+=1)resetRecord(bytes,32+index*280);
 bytes[4240]=100;return readStk(bytes);
}
function resetRecord(bytes:Uint8Array,offset:number){bytes.fill(0,offset,offset+280);bytes[offset+256]=100;bytes[offset+259]=127;}
function recordOffset(kit:Kit,slotNumber:number):number{
 if(!canEditKit(kit))throw new Error('Unrecognized kit settings version.');
 if(!Number.isInteger(slotNumber)||slotNumber<1||slotNumber>15)throw new Error('Slot must be an integer from 1 to 15.');
 return 32+(slotNumber-1)*280;
}
export function clearPad(kit:Kit,slotNumber:number):Uint8Array<ArrayBuffer>{
 const record=recordOffset(kit,slotNumber);const chunk=kit.chunks.find(c=>c.tag==='ISDT'&&readUint32(kit.source,c.offset+8)===slotNumber-1);
 if(!chunk){const result=new Uint8Array(kit.source);resetRecord(result,record);return result;}
 const discount=kit.slots.reduce((sum,slot)=>sum+(slot.sample?24+slot.sample.trailingBytes.length:0),0);const physical=kit.header.size===kit.source.length;
 if((!physical&&kit.header.size!==kit.source.length-discount)||kit.header.count!==kit.chunks.length)throw new Error('Unrecognized kit size or chunk count.');
 const output=new Uint8Array(kit.source.length-chunk.size);output.set(kit.source.subarray(0,chunk.offset));output.set(kit.source.subarray(chunk.offset+chunk.size),chunk.offset);resetRecord(output,record);
 const view=new DataView(output.buffer);view.setUint32(12,kit.header.count-1,true);view.setUint32(4,physical?output.length:output.length-discount+24+kit.slots[slotNumber-1]!.sample!.trailingBytes.length,true);return output;
}
export function validateName(name:string):string{
 const cleaned=name.trim().replace(/\.(wav|stk)$/i,'');
 if(!/^[a-zA-Z0-9 _-]{1,48}$/.test(cleaned)||!cleaned.trim())throw new Error('Use 1–48 letters, numbers, spaces, hyphens or underscores.');
 return cleaned.trim();
}
export function renameSample(kit:Kit,slotNumber:number,name:string):Uint8Array<ArrayBuffer>{
 const record=recordOffset(kit,slotNumber);if(!kit.slots[slotNumber-1]!.sample)throw new Error('Assign a sample before naming this pad.');
 const base=validateName(name);const output=new Uint8Array(kit.source);output.fill(0,record,record+256);output.set(new TextEncoder().encode(`SmplTrek/Pool/Audio/${base}.wav`),record);return output;
}
export function setPadColor(kit:Kit,slotNumber:number,color:number):Uint8Array<ArrayBuffer>{
 const record=recordOffset(kit,slotNumber);if(!Number.isInteger(color)||color<1||color>30)throw new Error('Color must be an integer from 1 to 30.');
 const output=new Uint8Array(kit.source);output[record+274]=color-1;return output;
}
