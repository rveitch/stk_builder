export interface Diagnostic { severity: 'warning' | 'info'; code: string; message: string; slot?: number; offset?: number }
export interface Chunk { tag: string; offset: number; size: number }
export interface WavInfo { format: number; channels: number; sampleRate: number; bitDepth: number; durationSeconds: number | null; previewSupported: boolean; chunks: Chunk[] }
export interface Sample { bytes: Uint8Array; trailingBytes: Uint8Array; info: WavInfo }
export interface Slot { index: number; path: string; rawRecord: Uint8Array; parameters: { level: number; pan: number; fxSend: number; chokeCode: number; pitchCents: number; colorCode: number }; sample?: Sample }
export interface Kit { source: Uint8Array; slots: Slot[]; chunks: Chunk[]; header: { size: number; count: number }; diagnostics: Diagnostic[] }
export const maxImportBytes = 64 * 1024 * 1024;
export const maxChunkCount = 4096;
