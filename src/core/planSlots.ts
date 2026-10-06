export interface SlotAssignment { filename: string; slot: number; reason: string }
type Kind = 'kick' | 'snare' | 'rim' | 'hat' | 'open' | 'clap' | 'crash' | 'ride' | 'tom' | 'perc';
function sampleKind(filename: string): Kind {
  const name = filename.toLowerCase().replace(/[_-]/g, ' ');
  if (/kick/.test(name)) return 'kick';
  if (/snare/.test(name)) return 'snare';
  if (/rim/.test(name)) return 'rim';
  if (/open.*hat/.test(name)) return 'open';
  if (/hi.?hat|closed.*hat/.test(name)) return 'hat';
  if (/clap/.test(name)) return 'clap';
  if (/ride/.test(name)) return 'ride';
  if (/crash|cymbal/.test(name)) return 'crash';
  if (/tom/.test(name)) return 'tom';
  return 'perc';
}
/** Reserve template matches before assigning leftovers, so extras cannot displace primary sounds. */
export function planSlots(filenames: string[]): SlotAssignment[] {
  if (filenames.length > 15) throw new Error('A kit supports at most 15 samples; split this folder explicitly.');
  if (new Set(filenames).size !== filenames.length) throw new Error('Duplicate sample filenames.');
  const samples = [...filenames].sort((a,b) => a.replace(/\.wav$/i, '').localeCompare(b.replace(/\.wav$/i, ''), 'en', {numeric:true})).map(filename => ({filename,kind:sampleKind(filename)}));
  const result: SlotAssignment[] = [];
  const assigned = new Set<string>();
  const occupied = new Set<number>();
  function put(filename:string, slots:number[], reason:string) {
    if (assigned.has(filename)) return;
    const slot=slots.find(candidate=>!occupied.has(candidate));
    if (slot === undefined) return;
    result.push({filename,slot,reason}); assigned.add(filename); occupied.add(slot);
  }
  const primary: Partial<Record<Kind,number[]>> = {kick:[1,2],snare:[3,4],rim:[5],open:[9],clap:[11],crash:[13,14],ride:[15],tom:[6,8,10,12]};
  for (const kind of ['kick','snare','rim','open','clap','crash','ride','tom'] as Kind[]) {
    for (const sample of samples.filter(item=>item.kind===kind)) put(sample.filename,primary[kind]!,`${kind} template`);
  }
  const hats=samples.filter(sample=>sample.kind==='hat');
  const numberedFirst=hats.find(sample=>/[_ -]0?1\.wav$/i.test(sample.filename));
  const numberedSecond=hats.find(sample=>/[_ -]0?2\.wav$/i.test(sample.filename));
  if (numberedFirst && numberedSecond) {
    put(numberedFirst.filename,[9],'first numbered hi-hat treated as open');
    put(numberedSecond.filename,[7],'second numbered hi-hat treated as closed');
  } else if (hats[0]) put(hats[0].filename,[7],'closed hi-hat template');
  // Named percussion gets its closest spare lower pad before unrelated alternates.
  for (const sample of samples.filter(item=>item.kind==='perc')) put(sample.filename,[5,11,15],'percussion on spare lower pad');
  for (const sample of samples.filter(item=>!assigned.has(item.filename))) {
    const preferred=sample.kind==='clap' ? [5,4,3,15] : sample.kind==='open'||sample.kind==='hat' ? [5,11,7,15,14] : [5,11,15];
    put(sample.filename,[...preferred,1,3,7,9,13,2,4,6,8,10,12,14],'extra sample in closest available slot');
  }
  return result.sort((a,b)=>a.slot-b.slot);
}
