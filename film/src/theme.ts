// Swissyphus: Carte Nationale system. Single source of truth for the film.
import { Easing } from "remotion";

export const theme = {
  colors: {
    lake: "#123C4D", // Lake Deep: ink, surfaces, rules
    contour: "#1F7A8C", // Contour: lines, secondary labels
    glacier: "#8FC1C4", // Glacier: fills, secondary text on dark
    snow: "#EEF3F2", // Snowfield: paper / primary text on dark
    trail: "#D97B4F", // Trail Marker: THE accent: the boulder
    night: "#0B2733", // deepest surfaces
    ink2: "#3D5A63", // body text on paper
    trailInk: "#B0532A", // accent text on paper
    trailLight: "#E8956C", // accent text on dark
    water: "#081F29",
  },
  alpha: {
    rule: "rgba(143,193,196,0.22)", // Glacier rule on dark
    ruleStrong: "rgba(143,193,196,0.5)",
    ruleOnPaper: "rgba(18,60,77,0.9)",
    hatchOnPaper: "rgba(31,90,110,.08)",
    hatchOnDark: "rgba(143,193,196,.045)",
  },
  fonts: {
    display: "'Archivo', sans-serif",
    body: "'Archivo', sans-serif",
    mono: "'IBM Plex Mono', monospace",
  },
  // Display face: Archivo Expanded (wdth 118), 800, uppercase, tracking -3%.
  display: {
    fontFamily: "'Archivo', sans-serif",
    fontVariationSettings: "'wdth' 118",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "-0.03em",
    lineHeight: 0.95,
  },
  eyebrow: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 500,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // easeOutExpo: entrances
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // easeInOutQuint: camera moves
    in: Easing.bezier(0.7, 0, 0.84, 0), // exits only
    soft: Easing.bezier(0.45, 0, 0.2, 1), // long glides
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
    settle: { damping: 200, stiffness: 120, mass: 1 },
  },
  layout: { W: 1920, H: 1080, margin: 72, gutter: 44 },
} as const;

export type Theme = typeof theme;
