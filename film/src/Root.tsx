import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import tl from "./timeline.json";
import { loadFonts } from "./lib/fonts";

loadFonts();

export const RemotionRoot: React.FC = () => (
  <Composition id="Swissyphus" component={Film} durationInFrames={tl.duration} fps={tl.fps} width={1920} height={1080} />
);
