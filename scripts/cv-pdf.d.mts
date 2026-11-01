/** Tipos de lo que exporta scripts/cv-pdf.mjs (las pruebas del admin recalculan el sello con esto). */
export interface CvHashes { es: string, en: string }
export interface CvStampFile extends CvHashes { at: string }

export const STAMP_FILE: string
export function stableJson(value: unknown): string
export function cvHash(data: unknown): string
export function cvHashes(origin?: string): Promise<CvHashes>
export function writeStamp(hashes: CvHashes, file?: string): Promise<CvStampFile>
