/** node:sqlite returns loosely typed rows; repositories narrow them through these helpers. */
export type Row = Record<string, unknown>;

export const str = (r: Row, k: string): string => String(r[k]);
export const num = (r: Row, k: string): number => Number(r[k]);
export const optStr = (r: Row, k: string): string | null => (r[k] == null ? null : String(r[k]));
