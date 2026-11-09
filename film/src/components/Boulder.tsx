// The boulder: one continuous object from the section, through the rollup, onto the train route.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { breathe, ease, sp } from "../lib/anim";
import { cameraAt, SECTION } from "../lib/camera";
import { toScreen } from "../lib/geo";
import { BOULDER_R, envelope, pointAt, ROUTE, ROUTE_CUM, type Pt } from "../lib/paths";
import tl from "../timeline.json";

export const ROLL = { start: 372, end: 528 };
export const ROLLUP = { home: [960, 196] as Pt, center: [960, 420] as Pt, absorb: [660, 712] as [number, number] };
export const TRAIN = { start: 900, end: 1012 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpP = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** x along the section for the roll, eased: a push, a steady roll, a last climb. */
export const rollX = (f: number) => {
  const t = ease(f, [ROLL.start, ROLL.end], [0, 1], theme.ease.soft);
  return SECTION.x0 + 6 + t * (SECTION.x1 - SECTION.x0 - 6);
};

export const summit = (): Pt => [SECTION.x1, envelope(SECTION.x1)];

export const boulderAt = (f: number, fps: number): { x: number; y: number; r: number; o: number } | null => {
  const S = tl.scenes;
  if (f < 344 || f >= S.cited[0] + tl.offset.cited - 30) return null;
  if (f < ROLL.start) {
    const s = sp(f, fps, 346, theme.spring.bouncy);
    const x = SECTION.x0 + 6;
    return { x, y: envelope(x), r: BOULDER_R * s, o: 1 };
  }
  if (f < 572) {
    const x = rollX(f);
    let y = envelope(x);
    if (f > ROLL.end) y += Math.abs(breathe(f, fps, 2.5, 2.4)) * -1;
    // arrival bump
    const bump = f > ROLL.end ? (1 - sp(f, fps, ROLL.end, theme.spring.bouncy)) * 0.18 : 0;
    return { x, y, r: BOULDER_R * (1 + bump), o: 1 };
  }
  if (f < 610) {
    const t = ease(f, [572, 608], [0, 1], theme.ease.inOut);
    const [x0, y0] = summit();
    const [x1, y1] = ROLLUP.home;
    // arc: rise then settle
    const x = lerp(x0, x1, t);
    const y = lerp(y0, y1, t) - Math.sin(t * Math.PI) * 90;
    return { x, y, r: lerp(BOULDER_R, 34, t), o: 1 };
  }
  if (f < ROLLUP.absorb[1]) {
    // absorbing cells: small pulses on each arrival wave
    let pulse = 0;
    for (let k = 0; k < 11; k++) {
      const at = ROLLUP.absorb[0] + 10 + k * 4.2;
      if (f >= at) pulse += (1 - sp(f, fps, at, theme.spring.bouncy)) * 0.06;
    }
    const grow = ease(f, [ROLLUP.absorb[0], ROLLUP.absorb[1]], [0, 1]);
    return { x: ROLLUP.home[0], y: ROLLUP.home[1] + breathe(f, fps, 3, 3), r: 34 * (1 + pulse + grow * 0.25), o: 1 };
  }
  if (f < 786) {
    const t = ease(f, [ROLLUP.absorb[1], ROLLUP.absorb[1] + 24], [0, 1], theme.ease.inOut);
    const [x, y] = lerpP(ROLLUP.home, ROLLUP.center, t);
    const r = lerp(34 * 1.25, 64, sp(f, fps, ROLLUP.absorb[1], theme.spring.smooth));
    return { x, y: y + breathe(f, fps, 3, 3), r, o: 1 };
  }
  const bern = (fr: number) => toScreen(cameraAt(fr), ROUTE[0]);
  if (f < 816) {
    const t = ease(f, [786, 814], [0, 1], theme.ease.inOut);
    const [x, y] = lerpP(ROLLUP.center, bern(f), t);
    return { x, y, r: lerp(64, 10, t), o: 1 };
  }
  if (f < TRAIN.start) {
    const [x, y] = bern(f);
    return { x, y, r: 10 + Math.abs(breathe(f, fps, 1.5, 1.2)), o: 1 };
  }
  const t = ease(f, [TRAIN.start, TRAIN.end], [0, 1], theme.ease.inOut);
  const [x, y] = toScreen(cameraAt(f), pointAt(ROUTE, ROUTE_CUM, t));
  return { x, y, r: 10, o: 1 };
};

export const Boulder: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = boulderAt(frame, fps);
  if (!b || b.r <= 0.1) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle cx={b.x} cy={b.y} r={b.r} fill={theme.colors.trail} opacity={b.o} />
      </svg>
    </AbsoluteFill>
  );
};
