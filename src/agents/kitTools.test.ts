import { expect, it } from 'vitest';
import { createKitTools, type KitAgentContext } from './kitTools';
import { createKit } from '../core/kitEditing';
import { encodePcm16 } from '../core/sampleAudio';
function setup() {
 let state={kit:createKit(),name:'New Kit',revision:0,busy:false};
 const wav=encodePcm16([new Float32Array(48000)]);
 const context:KitAgentContext={getState:()=>state,listSamples:()=>[{id:'sample-1',name:'Kick.wav',size:wav.length}],readSample:async()=>({name:'Kick.wav',bytes:wav}),commit:(kit,name)=>{state={...state,kit,name,revision:state.revision+1};}};
 const controller=new AbortController();const tools=createKitTools(context,controller.signal,async audio=>encodePcm16(audio.channels));
 function call(name:string,args:unknown){return tools.find(tool=>tool.name===name)!.execute(args);}
 return {call,context,controller,getState:()=>state};
}
it('builds a named kit with an explicit slot and edits through shared format rules',async()=>{
 const s=setup();await s.call('createKit',{expectedRevision:0,name:'Agent Kit'});
 await s.call('assignSample',{expectedRevision:1,slotNumber:3,sampleId:'sample-1'});
 await s.call('editPad',{expectedRevision:2,slotNumber:3,name:'Snare 1',color:30,level:75,pan:6,fxSend:46});
 expect(s.getState().name).toBe('Agent Kit');expect(s.getState().kit.slots[2]!.parameters).toMatchObject({level:75,pan:6,fxSend:46,colorCode:29});expect(s.getState().kit.slots[0]!.sample).toBeUndefined();
 await s.call('clearPad',{expectedRevision:3,slotNumber:3});expect(s.getState().kit.slots[2]!.sample).toBeUndefined();
});
it('rejects stale, malformed and invalid edits without changing kit',async()=>{
 const s=setup();for(const args of [{expectedRevision:9,slotNumber:1,level:50},{expectedRevision:0,slotNumber:1,level:128},{expectedRevision:0,slotNumber:1,color:2,path:'/tmp'},{expectedRevision:0,slotNumber:1,color:2,name:'../bad'}])await expect(s.call('editPad',args)).rejects.toThrow();
 expect(s.getState().revision).toBe(0);
});
it('revokes in-flight sample assignment and rejects concurrent stale work',async()=>{
 const s=setup();let finish!:(value:{name:string;bytes:Uint8Array})=>void;s.context.readSample=()=>new Promise(resolve=>{finish=resolve;});
 const pending=s.call('assignSample',{expectedRevision:0,slotNumber:1,sampleId:'sample-1'});s.controller.abort();finish({name:'Kick.wav',bytes:encodePcm16([new Float32Array(10)])});
 await expect(pending).rejects.toThrow(/disabled/);expect(s.getState().revision).toBe(0);
 await expect(s.call('createKit',{expectedRevision:0,name:'No'})).rejects.toThrow(/disabled/);
});
it('does not return audio bytes or browser files',async()=>{
 const s=setup();expect(JSON.stringify(await s.call('listAvailableSamples',{}))).not.toMatch(/bytes|arrayBuffer/);
 expect(JSON.stringify(await s.call('getKitState',{}))).not.toMatch(/rawRecord|source/);
});
it('rejects concurrent conversions and discards results after a manual edit',async()=>{
 const s=setup();let finish!:(value:{name:string;bytes:Uint8Array})=>void;s.context.readSample=()=>new Promise(resolve=>{finish=resolve;});
 const pending=s.call('assignSample',{expectedRevision:0,slotNumber:1,sampleId:'sample-1'});
 await expect(s.call('assignSample',{expectedRevision:0,slotNumber:3,sampleId:'sample-1'})).rejects.toThrow(/Wait/);
 s.context.commit(createKit(),'Manual change');finish({name:'Kick.wav',bytes:encodePcm16([new Float32Array(10)])});
 await expect(pending).rejects.toThrow(/changed/);expect(s.getState().name).toBe('Manual change');expect(s.getState().kit.slots[0]!.sample).toBeUndefined();
});
it('retains the conversion lock across disable and re-enable',async()=>{
 const s=setup();let finish!:(value:{name:string;bytes:Uint8Array})=>void;s.context.readSample=()=>new Promise(resolve=>{finish=resolve;});
 const pending=s.call('assignSample',{expectedRevision:0,slotNumber:1,sampleId:'sample-1'});s.controller.abort();
 const replacement=createKitTools(s.context,new AbortController().signal);
 await expect(replacement.find(tool=>tool.name==='assignSample')!.execute({expectedRevision:0,slotNumber:3,sampleId:'sample-1'})).rejects.toThrow(/Wait/);
 finish({name:'Kick.wav',bytes:encodePcm16([new Float32Array(10)])});await expect(pending).rejects.toThrow(/disabled/);
});
