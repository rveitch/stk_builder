import { describe, expect, it } from 'vitest';
import { planSlots } from './planSlots';

function mapping(names: string[]) {
  return Object.fromEntries(planSlots(names).map(item => [item.filename, item.slot]));
}
describe('automatic drum template', () => {
  it('keeps primary sounds in their template slots and retains extra hats', () => {
    expect(mapping(['Kick.wav','Snare.wav','Hi_Hat_01.wav','Hi_Hat_02.wav','Open_Hat.wav','Crash.wav'])).toEqual({
      'Kick.wav':1,'Snare.wav':3,'Hi_Hat_01.wav':5,'Hi_Hat_02.wav':7,'Open_Hat.wav':9,'Crash.wav':13,
    });
  });
  it('interprets numbered hats as open then closed without a named open hat', () => {
    expect(mapping(['Hi_Hat_02.wav','Hi_Hat_01.wav'])).toEqual({'Hi_Hat_01.wav':9,'Hi_Hat_02.wav':7});
  });
  it('reserves primary percussion before placing alternates', () => {
    expect(mapping(['Clap_02.wav','Perc.wav','Clap_01.wav','Snare.wav','Kick.wav'])).toEqual({
      'Clap_01.wav':11,'Clap_02.wav':4,'Perc.wav':5,'Snare.wav':3,'Kick.wav':1,
    });
  });
  it('keeps named open hats open and preserves all extra samples', () => {
    const result=mapping(['Open_Hat_01.wav','Open_Hat_02.wav','Open_Hat_03.wav','Clap.wav']);
    expect(result['Open_Hat_01.wav']).toBe(9);
    expect(result['Clap.wav']).toBe(11);
    expect(Object.keys(result)).toHaveLength(4);
    expect(new Set(Object.values(result)).size).toBe(4);
  });
  it('reserves matching upper slots and is independent of input order', () => {
    const names=['Kick_02.wav','Kick_01.wav','Tom_1.wav','Crash_02.wav','Crash_01.wav','Snare_Layer.wav','Snare.wav'];
    expect(mapping(names)).toEqual({'Kick_01.wav':1,'Kick_02.wav':2,'Tom_1.wav':6,'Crash_01.wav':13,'Crash_02.wav':14,'Snare.wav':3,'Snare_Layer.wav':4});
    expect(mapping([...names].reverse())).toEqual(mapping(names));
  });
  it('rejects overflow and duplicate inputs rather than discarding samples', () => {
    expect(()=>planSlots(Array.from({length:16},(_,i)=>`Sample${i}.wav`))).toThrow(/15/);
    expect(()=>planSlots(['Kick.wav','Kick.wav'])).toThrow(/duplicate/i);
  });
});
