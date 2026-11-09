import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { ease } from "../lib/anim";

/**
 * Map-sheet wipe: vertical bands that cover (mode "cover") or lift away (mode "reveal"),
 * staggered left→right. Cuts on the grid, not fades.
 */
export const SheetWipe: React.FC<{ start: number; mode: "cover" | "reveal"; color: string; bands?: number; dur?: number; stagger?: number; from?: "top" | "bottom" }> = ({
  start,
  mode,
  color,
  bands = 6,
  dur = 16,
  stagger = 2,
  from = "top",
}) => {
  const frame = useCurrentFrame();
  const w = 1920 / bands;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: bands }, (_, i) => {
        const t = ease(frame, [start + i * stagger, start + i * stagger + dur], [0, 1], mode === "cover" ? theme.ease.inOut : theme.ease.inOut);
        const s = mode === "cover" ? t : 1 - t;
        if (s <= 0) return null;
        const origin = mode === "cover" ? (from === "top" ? "top" : "bottom") : from === "top" ? "bottom" : "top";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.floor(i * w),
              width: Math.ceil(w) + 1,
              top: 0,
              bottom: 0,
              background: color,
              transformOrigin: origin,
              transform: `scaleY(${s})`,
              borderRight: s < 1 ? `1px solid ${theme.alpha.ruleStrong}` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
