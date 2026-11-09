// Deterministic soundtrack: ambient score at 100 BPM (cuts land on bars) + SFX cued to frames.
// Writes public/soundtrack.wav (48 kHz, 16-bit stereo). No downloads, no samples.
import fs from "node:fs";

const tl = JSON.parse(fs.readFileSync("src/timeline.json", "utf8"));
const SR = 48000;
const FPS = tl.fps;
const DUR = tl.duration / FPS + 0.5;
const N = Math.ceil(DUR * SR);
// Two buses: the music, and the sound effects (mixed lower, darker and with more reverb).
const MUS = [new Float32Array(N), new Float32Array(N)];
const FX = [new Float32Array(N), new Float32Array(N)];
let BUS = MUS;
const BEAT = 60 / tl.bpm; // 0.6 s
// Frames here are real (output) frames. Scenes are authored in design frames and play at design + offset:
const at = (k, f) => f + tl.offset[k];
const RS = Object.fromEntries(Object.entries(tl.scenes).map(([k, [a, b]]) => [k, [a + tl.offset[k], b + tl.offset[k]]]));
const fr = (f) => f / FPS;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// deterministic noise
let seed = 1234567;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296 * 2 - 1;
};

const add = (i, v, pan = 0) => {
  if (i < 0 || i >= N) return;
  BUS[0][i] += v * Math.cos((pan + 1) * Math.PI / 4);
  BUS[1][i] += v * Math.sin((pan + 1) * Math.PI / 4);
};
// smooth envelope helpers (no hard edges anywhere)
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const fadeIO = (t, dur, fin, fout) => smooth(t / fin) * smooth((dur - t) / fout);

// ── PAD ─────────────────────────────────────────────────────────────────────
const CHORDS = {
  Dm9: [50, 53, 57, 60, 64],
  Bbmaj9: [46, 53, 57, 60, 62],
  Fmaj7: [41, 53, 57, 60, 64],
  Am7: [45, 52, 55, 60, 64],
  Fmaj9: [41, 48, 57, 64, 67],
};
const PROG = ["Dm9", "Bbmaj9", "Fmaj7", "Am7"];
function pad(t0, dur, notes, amp, bright) {
  const att = 1.4, rel = 1.8;
  const i0 = Math.floor(t0 * SR), n = Math.floor((dur + rel) * SR);
  const tmpL = new Float32Array(n), tmpR = new Float32Array(n);
  notes.forEach((m, ni) => {
    for (const [det, pan] of [[-7, -0.6], [0, 0], [7, 0.6]]) {
      const f = mtof(m) * Math.pow(2, det / 1200);
      for (let h = 1; h <= 6; h++) {
        const a = amp / Math.pow(h, 1.7) / notes.length / 3 * (ni === 0 ? 1.3 : 1);
        const ph = rnd() * Math.PI * 2;
        const w = (2 * Math.PI * f * h) / SR;
        for (let k = 0; k < n; k++) {
          const t = k / SR;
          const env = Math.min(1, t / att) * (t > dur ? Math.max(0, 1 - (t - dur) / rel) : 1);
          const v = Math.sin(w * k + ph) * a * env;
          tmpL[k] += v * Math.cos((pan + 1) * Math.PI / 4);
          tmpR[k] += v * Math.sin((pan + 1) * Math.PI / 4);
        }
      }
    }
  });
  // one-pole lowpass for warmth
  const cut = 700 + 1500 * bright;
  const a = Math.exp((-2 * Math.PI * cut) / SR);
  let yl = 0, yr = 0;
  for (let k = 0; k < n; k++) {
    yl = (1 - a) * tmpL[k] + a * yl;
    yr = (1 - a) * tmpR[k] + a * yr;
    if (i0 + k < N) { MUS[0][i0 + k] += yl; MUS[1][i0 + k] += yr; }
  }
}
const BAR = BEAT * 4;
const S = tl.scenes;
const endBar = RS.end[0] / tl.framesPerBeat / 4; // 32
for (let b = 0; b < endBar; b += 2) {
  const name = PROG[(b / 2) % 4];
  const bright = Math.min(1, b / 22);
  pad(b * BAR, 2 * BAR, CHORDS[name], 0.34, bright);
}
pad(endBar * BAR, DUR - endBar * BAR - 1.2, CHORDS.Fmaj9, 0.42, 0.9);
pad(endBar * BAR + 4.8, DUR - endBar * BAR - 6.5, CHORDS.Fmaj9.map((m) => m + 12), 0.12, 0.5); // a soft upper bloom on the end card

// sub bass on chord roots
for (let b = 2; b < endBar; b += 2) {
  const root = CHORDS[PROG[(b / 2) % 4]][0] - 12;
  const f = mtof(root), i0 = Math.floor(b * BAR * SR), n = Math.floor(2 * BAR * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.4) * Math.min(1, (2 * BAR - t) / 0.4);
    add(i0 + k, Math.sin(2 * Math.PI * f * t) * 0.10 * env);
  }
}

// ── DRUMS ───────────────────────────────────────────────────────────────────
const DRUMS = 0.55; // drums sit back in the mix
function kick(t, amp = 0.55) {
  const i0 = Math.floor(t * SR), n = Math.floor(0.5 * SR);
  let ph = 0;
  for (let k = 0; k < n; k++) {
    const tt = k / SR;
    const f = 42 + 38 * Math.exp(-tt * 22); // gentle pitch drop: a felt thump, not a click
    ph += (2 * Math.PI * f) / SR;
    add(i0 + k, Math.sin(ph) * amp * DRUMS * smooth(tt / 0.006) * Math.exp(-tt * 6.5));
  }
}
function hat(t, amp = 0.05, pan = 0.3) {
  // soft shaker: band-limited noise, eased in, short tail
  const i0 = Math.floor(t * SR), n = Math.floor(0.09 * SR);
  let prev = 0, lp = 0;
  const a = Math.exp((-2 * Math.PI * 5200) / SR);
  for (let k = 0; k < n; k++) {
    const x = rnd();
    const hp = x - prev; prev = x;
    lp = (1 - a) * hp + a * lp;
    const tt = k / SR;
    add(i0 + k, lp * amp * 0.9 * DRUMS * smooth(tt / 0.004) * Math.exp(-tt * 45), pan);
  }
}
const beatsIn = (a, b) => { const out = []; for (let t = Math.ceil(fr(a) / BEAT - 1e-6) * BEAT; t < fr(b) - 1e-6; t += BEAT) out.push(t); return out; };
beatsIn(RS.myth[0], RS.rollup[0]).forEach((t, i) => i % 4 === 0 && kick(t, 0.42));
beatsIn(RS.rollup[0], RS.ask[0]).forEach((t, i) => i % 2 === 0 && kick(t, 0.46));
beatsIn(RS.ask[0], RS.cited[0]).forEach((t, i) => { if (i % 2 === 0) kick(t, 0.5); hat(t + BEAT / 2, 0.05); });
beatsIn(RS.cited[0], RS.running[0]).forEach((t, i) => { if (i % 2 === 0) kick(t, 0.44); hat(t + BEAT / 2, 0.035, -0.3); });
beatsIn(RS.running[0], RS.numbers[0]).forEach((t) => { kick(t, 0.5); hat(t + BEAT / 2, 0.06); hat(t + BEAT / 4, 0.025, -0.4); hat(t + (3 * BEAT) / 4, 0.025, -0.4); });
beatsIn(RS.numbers[0], RS.end[0] - 18).forEach((t, i) => { if (i % 2 === 0) kick(t, 0.48); hat(t + BEAT / 2, 0.045); });

// ── PLUCK ARP ───────────────────────────────────────────────────────────────
function pluck(t, m, amp, pan = 0, decay = 3.2) {
  const f = mtof(m), i0 = Math.floor(t * SR), n = Math.floor(1.4 * SR);
  for (let k = 0; k < n; k++) {
    const tt = k / SR;
    const env = smooth(tt / 0.01) * Math.exp(-tt * decay);
    add(i0 + k, (Math.sin(2 * Math.PI * f * tt) + 0.35 * Math.sin(4 * Math.PI * f * tt) + 0.12 * Math.sin(6 * Math.PI * f * tt)) * amp * env, pan);
  }
}
const chordAt = (t) => CHORDS[PROG[Math.floor(t / (2 * BAR)) % 4]];
const arpPattern = [0, 2, 1, 3, 2, 4, 3, 1];
function arp(a, b, step, amp, oct = 12) {
  let i = 0;
  for (let t = Math.ceil(fr(a) / step) * step; t < fr(b); t += step, i++) {
    const ch = chordAt(t);
    const m = ch[1 + (arpPattern[i % 8] % (ch.length - 1))] + oct;
    pluck(t, m, amp, i % 2 ? 0.35 : -0.35);
  }
}
// intro twinkles as contours draw
for (let i = 0; i < 9; i++) pluck(fr(12 + i * 17), [74, 76, 81, 79, 84, 81, 86, 84, 88][i], 0.05, (i % 3) - 1, 2.2);
arp(RS.ask[0] + 18, RS.cited[0] - 10, BEAT / 2, 0.036);
arp(RS.cited[0], RS.running[0], BEAT, 0.03);
arp(RS.running[0], RS.numbers[0], BEAT / 4, 0.022);
arp(RS.numbers[0], RS.end[0] - 18, BEAT / 2, 0.028);

// ── SFX ─────────────────────────────────────────────────────────────────────
// Everything here goes to the FX bus: lower, darker, reverbed, and every sound eases in and out.
const SFX = 0.5;
function airSwell(f0, dur = 1.2, amp = 0.2, up = true) {
  // the old white-noise whoosh, now a dark filtered air swell with a raised-cosine envelope
  dur = Math.max(1.1, dur * 1.3);
  const i0 = Math.floor(fr(f0) * SR - dur * 0.35 * SR), n = Math.floor(dur * SR);
  let l1 = 0, l2 = 0;
  for (let k = 0; k < n; k++) {
    const t = k / n;
    const sweep = up ? smooth(t) : 1 - smooth(t);
    const a = Math.exp((-2 * Math.PI * (160 + 1300 * sweep)) / SR);
    l1 = (1 - a) * rnd() + a * l1;
    l2 = (1 - a) * l1 + a * l2; // two poles: no hiss
    const env = Math.sin(Math.PI * t) ** 2;
    add(i0 + k, l2 * amp * 2.6 * SFX * env, (t - 0.5) * 0.8);
  }
}
const whoosh = airSwell;
function riser(f0, f1, amp = 0.12) {
  const i0 = Math.floor(fr(f0) * SR), n = Math.floor(fr(f1 - f0) * SR);
  let l1 = 0, l2 = 0;
  for (let k = 0; k < n; k++) {
    const t = k / n;
    const a = Math.exp((-2 * Math.PI * (150 + 1000 * t * t)) / SR);
    l1 = (1 - a) * rnd() + a * l1;
    l2 = (1 - a) * l1 + a * l2;
    const tone = Math.sin(2 * Math.PI * (220 + 220 * t * t) * (k / SR)) * 0.08;
    const env = smooth(t / 0.85) * smooth((1 - t) / 0.18); // swells, then releases instead of cutting off
    add(i0 + k, (l2 * 3 + tone) * amp * 0.6 * SFX * env);
  }
}
function boom(f0, amp = 0.8) {
  BUS = MUS; kick(fr(f0), amp * 0.8); BUS = FX;
  const i0 = Math.floor(fr(f0) * SR), n = Math.floor(2.6 * SR);
  let l1 = 0, l2 = 0;
  const a = Math.exp((-2 * Math.PI * 120) / SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    l1 = (1 - a) * rnd() + a * l1;
    l2 = (1 - a) * l1 + a * l2;
    add(i0 + k, (l2 * 3.5 + Math.sin(2 * Math.PI * 36 * t) * 0.2) * amp * 0.45 * SFX * smooth(t / 0.03) * Math.exp(-t * 1.8));
  }
}
function tick(f0, amp = 0.06, freq = 3200, pan = 0) {
  // a soft wooden tock instead of a click: lower, eased in, slightly longer
  const f = freq * 0.55, i0 = Math.floor(fr(f0) * SR), n = Math.floor(0.06 * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    add(i0 + k, Math.sin(2 * Math.PI * f * t) * amp * 0.6 * SFX * smooth(t / 0.0025) * Math.exp(-t * 110), pan);
  }
}
function pop(f0, amp = 0.09, pan = 0, base = 900) {
  const i0 = Math.floor(fr(f0) * SR), n = Math.floor(0.18 * SR);
  let ph = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    ph += (2 * Math.PI * (base * (0.6 + 0.4 * Math.exp(-t * 30)))) / SR;
    add(i0 + k, Math.sin(ph) * amp * 0.8 * SFX * smooth(t / 0.005) * Math.exp(-t * 24), pan);
  }
}
function bell(f0, m, amp = 0.1, pan = 0) {
  const f = mtof(m), i0 = Math.floor(fr(f0) * SR), n = Math.floor(3.5 * SR);
  const parts = [[1, 1], [2.76, 0.32], [5.4, 0.14], [8.93, 0.05]];
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    let v = 0;
    for (const [r, a] of parts) v += Math.sin(2 * Math.PI * f * r * t) * a * Math.exp(-t * (1.1 + r * 0.45));
    add(i0 + k, v * amp * 0.9 * SFX * smooth(t / 0.008), pan);
  }
}
function rumble(fa, fb, amp, speedFn) {
  const i0 = Math.floor(fr(fa) * SR), n = Math.floor(fr(fb - fa) * SR);
  let lp = 0, lp2 = 0;
  for (let k = 0; k < n; k++) {
    const a = Math.exp((-2 * Math.PI * 110) / SR);
    lp = (1 - a) * rnd() + a * lp;
    lp2 = (1 - a) * lp + a * lp2;
    const t = k / n;
    const env = smooth(t / 0.15) * smooth((1 - t) / 0.2) * speedFn(t);
    add(i0 + k, lp2 * amp * 14 * SFX * 1.4 * env);
  }
}

BUS = FX;
// Scene 1: the map builds
riser(0, 40, 0.06);
for (let i = 0; i < 10; i++) pop(150 + i * 3, 0.035, (i % 3 - 1) * 0.5, 1400);
riser(262, 300, 0.1);
whoosh(298, 1.3, 0.2); // rotation
boom(352, 0.45); // section lands
// Scene 2: the roll
rumble(372, 532, 0.16, (t) => 0.6 + 0.6 * Math.sin(Math.PI * t));
bell(528, 81, 0.11); bell(531, 88, 0.05, 0.4);
whoosh(570, 0.9, 0.18, true);
// Scene 3: rollup
for (let f = 592; f < 628; f += 2) tick(f, 0.03, 2600 + (f % 6) * 200, 0.3);
for (let k = 0; k < 11; k++) pop(660 + 10 + k * 4.2, 0.06, 0, 600 + k * 40);
bell(716, 74, 0.09); bell(722, 81, 0.07, -0.3);
whoosh(782, 0.8, 0.2, false);
// Scene 4: ask
for (let i = 0; i < 84; i++) if (i % 2 === 0) tick(814 + i / 1.9, 0.035, 4200 + ((i * 37) % 900), -0.2);
[862, 867, 872, 877, 882].forEach((f, i) => pop(f, 0.045, 0.2, 1250 - i * 60));
rumble(900, 1014, 0.08, () => 1); // train to Zermatt
bell(958, 79, 0.09, -0.2); // train answer cited
whoosh(1030, 1.4, 0.13, true); // glide to Gornergrat
bell(1106, 84, 0.09, 0.2); // snow answer cited
whoosh(1166, 1.5, 0.13, true); // glide out over Valais
pop(1206, 0.07, -0.3, 760); // SLF: no bulletin yet
pop(1214, 0.09, 0.2, 520); pop(1219, 0.08, 0.2, 400); // MeteoSwiss flood warning
pop(1225, 0.06, 0.3, 640); pop(1231, 0.06, -0.3, 600); // Alertswiss
bell(1236, 74, 0.1); // safety answer cited
riser(1314, 1340, 0.1);
whoosh(1332, 0.9, 0.22, true); // card unfolds to paper
// Scene 5: cited (design frames)
const c5 = (f) => at("cited", f);
for (let i = 0; i < 24; i++) tick(c5(1246 + i * 2.2), 0.025, 2400 + (i % 4) * 300, 0.25);
[1306, 1340, 1372, 1404].forEach((f, i) => pop(c5(f), 0.06, -0.2, 800 + i * 120));
bell(c5(1420), 86, 0.08);
whoosh(c5(1486), 0.7, 0.2, false);
// Scene 6: running (design frames; two bars longer)
const c6 = (f) => at("running", f);
for (let c = 0; c < 5; c++) tick(c6(1566 + c * 11), 0.035, 5200, 0.4);
pop(c6(1630), 0.09, 0, 420); pop(c6(1636), 0.08, 0, 300); // source down
pop(c6(1764), 0.07, 0, 700); pop(c6(1769), 0.07, 0, 1000); // back up
whoosh(c6(1854), 0.6, 0.2, false);
// Scene 7: numbers (design frames; two bars longer): counters, command, pins dropping across the country
const c7 = (f) => at("numbers", f);
for (let f = 1750; f < 1830; f += 2) tick(c7(f), 0.024, 3000 + (f % 8) * 150, -0.3);
for (let i = 0; i < 17; i++) tick(c7(1764 + i / 1.2), 0.03, 4400, 0.2);
for (let r = 0; r < 88; r += 2) pop(c7(1728 + 18 + (r / 88) * 74), 0.028, ((r * 37) % 100) / 50 - 1, 900 + ((r * 53) % 7) * 90);
riser(c7(1984), c7(2016), 0.12);
// Scene 8: end (design frames)
const c8 = (f) => at("end", f);
boom(c8(1872), 0.6); // the mark lands: a soft, low bloom
rumble(c8(1888), c8(1944), 0.09, (t) => (1 - t) * (1 - t)); // the roll, slowing to rest
bell(c8(1944), 77, 0.12, -0.1); bell(c8(1946), 84, 0.08, 0.3); // comes to rest
for (let i = 0; i < 17; i++) tick(c8(1952 + i / 1.3), 0.028, 4400, 0.2);
bell(c8(1994), 89, 0.05, 0.4);
bell(c8(2070), 84, 0.04, -0.4); bell(c8(2150), 81, 0.035, 0.3); // distant, as the end card holds

// ── MASTER ──────────────────────────────────────────────────────────────────
// Freeverb-style room: more on the FX bus, a touch on the music. Softens every transient.
function reverb(inL, inR, room = 0.82, damp = 0.35) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116].map((d) => Math.round((d * SR) / 44100));
  const aps = [556, 441, 341, 225].map((d) => Math.round((d * SR) / 44100));
  const run = (inp, spread) => {
    const out = new Float32Array(N);
    for (const d0 of combs) {
      const d = d0 + spread, buf = new Float32Array(d);
      let idx = 0, store = 0;
      for (let k = 0; k < N; k++) {
        const y = buf[idx];
        store = y * (1 - damp) + store * damp;
        buf[idx] = inp[k] * 0.015 + store * room;
        out[k] += y;
        idx = idx + 1 === d ? 0 : idx + 1;
      }
    }
    for (const d0 of aps) {
      const d = d0 + spread, buf = new Float32Array(d);
      let idx = 0;
      for (let k = 0; k < N; k++) {
        const b = buf[idx];
        const y = -out[k] + b;
        buf[idx] = out[k] + b * 0.5;
        out[k] = y;
        idx = idx + 1 === d ? 0 : idx + 1;
      }
    }
    return out;
  };
  return [run(inL, 0), run(inR, 23)];
}
// darken the FX bus a little (one-pole at 6.5 kHz) before it goes anywhere
for (const ch of FX) {
  const a = Math.exp((-2 * Math.PI * 6500) / SR);
  let y = 0;
  for (let k = 0; k < N; k++) { y = (1 - a) * ch[k] + a * y; ch[k] = y; }
}
const send = [new Float32Array(N), new Float32Array(N)];
for (let c = 0; c < 2; c++) for (let k = 0; k < N; k++) send[c][k] = FX[c][k] * 0.9 + MUS[c][k] * 0.22;
const [wl, wr] = reverb(send[0], send[1]);
const L = new Float32Array(N), R = new Float32Array(N);
for (let k = 0; k < N; k++) {
  L[k] = MUS[0][k] + FX[0][k] * 0.75 + wl[k] * 0.55;
  R[k] = MUS[1][k] + FX[1][k] * 0.75 + wr[k] * 0.55;
}
// long, smooth fades at both ends (raised cosine), soft-clip, normalise to -1 dBFS
const filmEnd = tl.duration / FPS;
const fadeIn = 1.6, fadeOut = 3.8;
let peak = 0;
for (let k = 0; k < N; k++) {
  const t = k / SR;
  const g = smooth(t / fadeIn) * smooth((filmEnd - t) / fadeOut);
  L[k] = Math.tanh(L[k] * 1.1) * g;
  R[k] = Math.tanh(R[k] * 1.1) * g;
  peak = Math.max(peak, Math.abs(L[k]), Math.abs(R[k]));
}
// level to a calm loudness (RMS ≈ −19 dBFS over the body of the film), never above −1 dBFS peak
let ss = 0, cnt = 0;
for (let k = Math.floor(3 * SR); k < Math.floor((filmEnd - 5) * SR); k++) { ss += L[k] * L[k] + R[k] * R[k]; cnt += 2; }
const rms = Math.sqrt(ss / cnt);
const norm = Math.min(Math.pow(10, -19 / 20) / rms, 0.89 / peak);
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let k = 0; k < N; k++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[k] * norm)) * 32767), 44 + k * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[k] * norm)) * 32767), 46 + k * 4);
}
fs.writeFileSync("public/soundtrack.wav", buf);
console.log("soundtrack", DUR.toFixed(1), "s, peak", peak.toFixed(3));
