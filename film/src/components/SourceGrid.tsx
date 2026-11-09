import { live } from "../lib/geo";

export const SOURCES: string[] = live.sources as string[];

export const gridLayout = (x0: number, y0: number, cols: number, cw: number, ch: number) =>
  SOURCES.map((id, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return { id, i, col, row, x: x0 + col * cw, y: y0 + row * ch, cx: x0 + col * cw + cw / 2, cy: y0 + row * ch + ch / 2 };
  });
