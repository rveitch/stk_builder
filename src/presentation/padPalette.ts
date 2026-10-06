// Approximate display swatches from the user's numbered LED photographs.
// Stored index -> displayed color number remains provisional.
const colors = ['#b4e85c','#deea77','#f0ce7b','#f59877','#dab18d','#bba9e6','#ca93ec','#e77cd9','#ed31d0','#c42af0','#b32bf0','#9536ed','#a185f4','#7860f4','#6435ed','#8c41ed','#a449f0','#b28bef','#8d85ef','#7e9aef','#009aff','#1258f4','#009bd6','#00b8e8','#02c9da','#6bcfe6','#8cd9dd','#8bddbd','#00d8b3','#00dba5'];
export function getPadColor(storedValue: number) {
  const hex = colors[storedValue]; return { number: hex ? storedValue + 1 : null, hex: hex ?? '#88919a' };
}
