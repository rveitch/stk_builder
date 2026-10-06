export class FormatError extends Error {
  constructor(public code: string, public offset: number, message: string) { super(`${message} (byte ${offset})`); this.name = 'FormatError'; }
}
export function requireBytes(bytes: Uint8Array, offset: number, size: number): void {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(size) || offset < 0 || size < 0 || offset + size > bytes.length) {
    throw new FormatError('OUT_OF_BOUNDS', offset, 'File is truncated or contains an invalid length');
  }
}
export function readTag(bytes: Uint8Array, offset: number): string {
  requireBytes(bytes, offset, 4); return String.fromCharCode(...bytes.subarray(offset, offset + 4));
}
export function readUint32(bytes: Uint8Array, offset: number): number {
  requireBytes(bytes, offset, 4); return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
}
