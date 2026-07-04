# Cascade brag video — build notes

## Revision: Scene 0 prepended (About-screen feature tour)

The approved 22.2s cut (old Scene 1-4: Hook -> Reveal+flow -> Completion+confetti
-> Punchline/outro) is preserved **byte-for-byte in content and internal
timing** — only shifted later by +9.0s. New total duration: 31.2s.

How the shift was done without touching the approved cut's internals:
- Scenes 1-4 were already coded with named base-time constants (`S2`, `S3`,
  `S4` — everything inside each scene is `S2 + offset` etc.), so the whole
  scene's internal choreography moved by editing exactly one line per scene
  (`var S2 = 3.0` -> `12.0`, etc.). Scene 1 didn't have such a constant
  originally (its tween times were literals), so `var S1 = 9.0` was
  introduced and its literal times rewritten as `S1 + 0.15` etc. — the
  numbers themselves (0.15, 0.3, 2.35) are unchanged.
- The music (`#bgm`) now starts at `data-start="9.0"` instead of `0` — its
  own internal content/volume-automation timeline is untouched, it just
  begins 9s later. Every beat-lock (8.74s/13.11s/17.47s/19.66s *relative to
  the music*) is therefore still correct at the new absolute times
  (17.74/22.11/... = old value + 9.0) without recalculating a single cue.
- The two audio-reactive RMS loops (Scene 1's headline glow, Scene 4's logo
  glow) read `AUDIO_DATA.frames[].time`, which is relative to the *music
  track's own start* (0-20s), not the composition's global clock. Since the
  music now starts 9s later, these loops keep their original track-relative
  comparison bounds (0-3s for Scene 1, 18.96-20.0s for Scene 4 — both
  unchanged numbers) and add `+ S1` only when scheduling the `tl.call` on
  the shared global timeline. This was the one real gotcha in the shift —
  get it wrong and the glow breathes on the wrong frames.
- All 5 pre-existing SFX `<audio>` elements' `data-start` shifted by +9.0.

Scene 0 itself (0.0-9.0s) is new: recreates
`src/components/about/FeaturesSection.tsx` — eyebrow + heading settle, then
4 real feature cards (Multiple Boards, Search and Filters, Keyboard
Shortcuts, PWA Ready — deliberately the ones NOT already demonstrated live
in Scenes 1-3) stagger into a 2x2 grid, hold, then crossfade into the
untouched Scene 1 "Own your data." stamp. No score under Scene 0 — only 4
soft `click-soft.mp3` ticks as each card lands (see the `sfx-s0-card-*`
elements), confirmed via `ffmpeg volumedetect`: Scene 0 measures ~-46.6dB
mean / -13.3dB peak (tick-only) vs. ~-30dB mean / -7.9dB peak once the score
starts at 9.0s.

## Audio-reactive treatment: applied

Per-frame RMS was pre-extracted from the music track with
`hyperframes-creative/scripts/extract-audio-data.py` (fps=30, bands=4, then
trimmed to the first 20s / 600 frames and reduced to `{time, rms}` — see
`assets/audio-data.json`). The composition loads it via synchronous XHR and
samples it with `tl.call()` once per frame (not a single tween), per the
audio-reactive workflow.

Two subtle breathing glows are driven by RMS:
- `#s1-glow` behind the Scene 1 "Own your data." headline (opacity 0.45-0.70).
- `#s4-logo-glow` behind the Scene 4 closing Cascade lockup (opacity 0.40-0.65).

Both stay within the "subtle for background elements" guidance — no
waveform/equalizer visuals, no per-word or per-beat pulsing on text.

## `hyperframes validate` contrast warnings: investigated, not real defects

`validate` reports 80 WCAG contrast warnings, all against Scene 2/3 board
text (wordmark, column titles, card titles/metadata, count pills). All of
them are false positives caused by the validator sampling those elements'
computed styles at timeline positions **outside** that clip's own
`[data-start, data-start+data-duration]` window (e.g. Scene 2/3 text is
flagged even at t=2.22s, before Scene 2 starts at t=3.0s).

Evidence this is a sampling artifact, not a real defect:
- The ratios match "text color vs `#000` (the page's default `html,body`
  background)" almost exactly — e.g. `#13141B` (near-black title text) vs
  `#000` computes to ~1.03:1, and `#6F6F75` (gray metadata/count text) vs
  `#000` computes to ~3.5-3.8:1 — both match the reported numbers precisely.
  The real board backgrounds (`#F4F4F0` / `#EDEDEA` / `#FFFFFF`) are never
  in the comparison at all, which only happens when the element is not
  actually composited on screen at that instant.
- `hyperframes snapshot --at 1.5,6.66,11.1,17,19.98` followed by visual
  inspection of the captured frames shows every scene rendering exactly as
  designed, with high real contrast (dark Inkwell slate text on white/paper
  or stone-gray surfaces, easily exceeding 4.5:1). See `snapshots/` (frames
  regenerated on demand; not committed).
- `hyperframes inspect` (which seeks the real timeline the same way
  `render` does) reports 0 layout issues across 9 samples.

Conclusion: real, visible contrast throughout the video meets WCAG AA.
Left as-is rather than recoloring content that is provably off-screen when
the warning fires.

## Scope note

`hyperframes lint` also reports 3 non-blocking warnings recommending the
video be split into sub-compositions (`compositions/*.html`) for
file-size/track-density reasons. Kept monolithic for this build — a single
`index.html` was the lower-risk choice for one-pass authoring (no
cross-file mount failures to debug), and lint reports 0 errors either way.
