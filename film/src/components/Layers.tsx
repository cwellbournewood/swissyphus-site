import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { breathe } from "../lib/anim";

const { colors: c, alpha } = theme;

/** Layer 1: drifting mesh on Night, never a flat solid. */
export const BgMesh: React.FC<{ paper?: boolean }> = ({ paper }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ax = 30 + breathe(frame, fps, 8, 11);
  const ay = 25 + breathe(frame, fps, 6, 13, 1);
  const bx = 75 + breathe(frame, fps, 7, 9, 2);
  const by = 80 + breathe(frame, fps, 5, 12, 3);
  if (paper) {
    return (
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 60% at ${ax}% ${ay}%, rgba(143,193,196,0.22), transparent 70%), radial-gradient(60% 50% at ${bx}% ${by}%, rgba(31,122,140,0.08), transparent 70%), ${c.snow}`,
        }}
      />
    );
  }
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(60% 55% at ${ax}% ${ay}%, rgba(31,122,140,0.30), transparent 70%), radial-gradient(55% 50% at ${bx}% ${by}%, rgba(18,60,77,0.85), transparent 70%), ${c.night}`,
      }}
    />
  );
};

/** The 105° hatch from the brand paper. */
export const Hatch: React.FC<{ paper?: boolean; opacity?: number }> = ({ paper, opacity = 1 }) => (
  <AbsoluteFill
    style={{
      opacity,
      background: `repeating-linear-gradient(105deg, transparent 0 52px, ${paper ? alpha.hatchOnPaper : alpha.hatchOnDark} 52px 53px)`,
    }}
  />
);

/** Layer 4: colour grade: cool shadows, a touch of lift in the highlights. */
export const Grade: React.FC<{ paper?: boolean }> = ({ paper }) => (
  <AbsoluteFill
    style={{
      background: paper
        ? "linear-gradient(180deg, rgba(143,193,196,0.06), rgba(18,60,77,0.05))"
        : "linear-gradient(180deg, rgba(11,39,51,0.25) 0%, rgba(11,39,51,0) 30%, rgba(11,39,51,0) 65%, rgba(11,39,51,0.45) 100%)",
      mixBlendMode: paper ? "multiply" : "normal",
      pointerEvents: "none",
    }}
  />
);

/** Layer 5a: animated film grain. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();
  // deterministic jitter per frame
  const jx = (frame * 73) % 512;
  const jy = (frame * 151) % 512;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile("grain.png")})`,
        backgroundPosition: `${jx}px ${jy}px`,
        backgroundSize: "512px 512px",
        mixBlendMode: "overlay",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

/** Layer 5b: vignette. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(120% 95% at 50% 50%, transparent 55%, rgba(6,22,30,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

export const Finish: React.FC<{ paper?: boolean }> = ({ paper }) => (
  <>
    <Grade paper={paper} />
    <Grain opacity={paper ? 0.05 : 0.075} />
    <Vignette strength={paper ? 0.16 : 0.55} />
  </>
);

/** Brand mark: boulder on the slope (38-unit grid). */
export const Mark: React.FC<{ size: number; dark?: boolean; slope?: number; boulder?: number }> = ({
  size,
  dark = true,
  slope = 1,
  boulder = 1,
}) => (
  <svg width={size} height={size} viewBox="0 0 38 38" style={{ display: "block", overflow: "visible" }}>
    <path d="M0 38H38V13Z" fill={dark ? c.glacier : c.lake} style={{ transformOrigin: "0px 38px", transform: `scale(${slope})` }} />
    <circle cx={28} cy={8} r={8 * boulder} fill={c.trail} />
  </svg>
);

export const ReliefImg: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <Img src={staticFile("relief.jpg")} style={{ position: "absolute", left: 0, top: 0, ...style }} />
);
