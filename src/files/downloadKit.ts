export function downloadKit(bytes: Uint8Array<ArrayBuffer>, sourceName: string, edited: boolean): void {
  const base = (sourceName.split(/[\\/]/).at(-1) || 'Kit').replace(/\.stk$/i, '').replace(/[<>:"|?*]/g, '_').split('').map(character => character.charCodeAt(0) < 32 ? '_' : character).join('');
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${base}-${edited ? 'edited' : 'copy'}.stk`;
  document.body.append(anchor);
  try { anchor.click(); } finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
