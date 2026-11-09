import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import tl from "./timeline.json";
import { BgMesh, Finish, Hatch } from "./components/Layers";
import { MapLayer } from "./components/MapLayer";
import { Boulder } from "./components/Boulder";
import { S1Map } from "./scenes/S1Map";
import { S2Myth } from "./scenes/S2Myth";
import { S3Rollup } from "./scenes/S3Rollup";
import { S4Ask } from "./scenes/S4Ask";
import { S5Cited } from "./scenes/S5Cited";
import { S6Running } from "./scenes/S6Running";
import { S7Numbers } from "./scenes/S7Numbers";
import { S8End } from "./scenes/S8End";

const S = tl.scenes;
const O = tl.offset;
const inRange = (f: number, a: number, b: number) => f >= a && f < b;
type Key = keyof typeof S;

/** Plays a scene authored in design frames at design + offset (useCurrentFrame inside returns design frames). */
const Shifted: React.FC<{ k: Key; children: React.ReactNode }> = ({ k, children }) => {
  const f = useCurrentFrame();
  const visible = inRange(f, S[k][0] + O[k], S[k][1] + O[k]);
  return (
    <Sequence from={O[k]} layout="none" name={k}>
      {visible ? children : null}
    </Sequence>
  );
};

export const Film: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  const f = useCurrentFrame();
  const paper = inRange(f, S.cited[0] + O.cited, S.cited[1] + O.cited);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B2733" }}>
      {/* 1 · background */}
      <BgMesh />
      <Hatch opacity={0.9} />
      {/* 2 · assets: the map */}
      {inRange(f, 0, 376) && <MapLayer intro />}
      {inRange(f, S.ask[0], S.ask[1]) && <MapLayer />}
      <Shifted k="numbers">
        <MapLayer dim={0.38} />
      </Shifted>
      {/* 3 · graphics & type */}
      {inRange(f, 0, 392) && <S1Map />}
      {inRange(f, 330, 600) && <S2Myth />}
      {inRange(f, S.rollup[0] - 8, S.rollup[1]) && <S3Rollup />}
      {inRange(f, S.ask[0], S.ask[1]) && <S4Ask />}
      <Shifted k="cited">
        <S5Cited />
      </Shifted>
      <Shifted k="running">
        <S6Running />
      </Shifted>
      <Shifted k="numbers">
        <S7Numbers />
      </Shifted>
      <Shifted k="end">
        <S8End />
      </Shifted>
      <Boulder />
      {/* 4–5 · grade, grain, vignette */}
      <Finish paper={paper} />
      {withAudio && <Audio src={staticFile("soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
