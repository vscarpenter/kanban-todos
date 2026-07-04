# Hyperframes Composition Brief: Cascade

## Objective
Create a short launch-style brag video for Cascade, a privacy-first, 100%-client-side kanban task manager.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `/Users/vinnycarpenter/Projects/kanban-todos`
- Primary files read: `src/app/globals.css` (Inkwell design tokens), `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/about/HeroSection.tsx`, `FeaturesSection.tsx`, `PrivacySection.tsx`, `src/components/kanban/TaskCard.tsx`, `src/lib/utils/celebrateCompletion.ts`, `README.md`
- Product name: Cascade
- Tagline / strongest claim: "Own your data." / "This isn't a privacy policy. It's an architectural fact."
- Key UI or visual moment to recreate: the three-column kanban board (To Do / In Progress / Done) with real status-dot colors, a task card being dragged across columns, and the confetti + "Task completed" toast that fires today in `celebrateCompletion.ts` when a task drops into Done.
- Copy that must appear verbatim:
  - "Own your data."
  - "This isn't a privacy policy."
  - "It's an architectural fact."
  - "No account. No server. No tracking."
  - "Task completed" (toast text)

## Creative Direction
- Tone preset: polished
- Creative direction: quiet-confidence product film — prove the privacy claim by showing the app actually work, then land the deadpan "architectural fact" line without winking at the camera.
- Interpretation: few scenes, longer holds, restrained motion. Energy comes from the drag-and-drop and confetti payoff being real and satisfying, not from fast cuts or loud type. No jokes, no irony.
- Angle: Most "privacy-first" apps ask you to take their word for it. Cascade's own copy doesn't call it a promise — it calls it "an architectural fact." The video proves that line by showing the product actually working, then lands on the deadpan claim that there's no server behind any of it.
- Hook: "Own your data." in large serif type on the ivory background, the accent-indigo period landing like a stamp.
- Outro / punchline: "This isn't a privacy policy. / It's an architectural fact." over dark mode, then the Cascade wordmark + icon + cascade.vinny.dev.
- Avoid:
  - Generic SaaS language ("streamline your workflow" etc.)
  - Abstract filler visuals — no stock-style motion graphics unrelated to the actual product
  - Redesigning the product's look — use its real Inkwell palette/typography, don't invent a new one

## Visual Identity
- Background: `#F4F4F0` ivory (light scenes) / `#0F1018` near-black (dark scenes)
- Text: `#13141B` slate (light) / `#E8E8EE` (dark)
- Accent: `#3B4A8C` indigo (light) / `#7A8AD1` periwinkle (dark)
- Card/paper surface: `#FFFFFF` (light) / `#181A24` (dark); column surface `#EDEDEA` (light) / `#1E1F29` (dark); hairline borders `#CFCFCC` (light) / `#34363F` (dark)
- Status dots: To Do = `#5C7CA3` (info blue), In Progress = `#C78E3F` (warning amber), Done = `#788C5D` (olive green)
- Display font: `ui-serif, Georgia, "Times New Roman", Times, serif` (headings/punchline type) — platform fonts only, no Google Fonts
- Body font: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- App icon: `/Users/vinnycarpenter/Projects/kanban-todos/public/images/cascade-icon.svg` — copy into composition assets and use for the wordmark lockup
- Visual references from the project: 1.5px hairline card borders, 12-14px radii, soft layered shadows (`0 1px 2px rgba(20,20,19,.06)` up to `0 12px 28px rgba(20,20,19,.12)`), card-hover lift, the `card-enter` keyframe (fade + translateY(8px)→0 + scale .98→1)

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract. Full scene detail, audio-coupled ideas, and beat-cue targets live there — read it before building.

Scene summary:
1. Hook — 3.0s — "Own your data." settles on ivory, accent period stamps in.
2. Reveal + flow — 6.5s — real 3-column board; a task title types into "Add Task"; card slides in; cursor drags it from To Do into In Progress, landing on the ~8.74s beat cue.
3. Completion + confetti — 5.0s — card dragged from In Progress into Done; confetti burst + "Task completed" toast fire on drop (~13.11s beat cue); hold on the satisfied board.
4. Punchline / outro — 5.5s — dark mode; "This isn't a privacy policy." then "It's an architectural fact." settle in sequence (~17.47-18.56s); Cascade wordmark + icon + cascade.vinny.dev + "No account. No server. No tracking." lock in as the closing card (~19.66s).

## Audio
- Audio role: warm, restrained bed with a few motion-matched accents — polished, not chaotic.
- Audio arc: bed fades in under the hook, stays light through the flow scene, small swell under the confetti payoff, resolves and fades under the closing logo card.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady/clean; recommended for `polished`/`cinematic`), volume ~0.30.
- Music treatment: start at 0s; small volume swell (~0.35) under the Scene 3 confetti beat; fade to ~0 over the last ~1.5s under the logo lock.
- Music cue guidance: bundled preset at `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json` (tempo ≈109.96 BPM). Target strong cues: 8.74s (card lands in In Progress), 13.11s (card lands in Done / confetti), 17.47s or 18.56s (second punchline line settles), 19.66s (logo card lock). These are optional timing hints — nudge tweens within ±0.15s of a cue, never sacrifice readability for the lock.
- Audio-reactive treatment: subtle — the accent-indigo glow behind the hook headline and behind the closing logo card may breathe slightly with music RMS. No waveform/equalizer visuals.
- Audio-coupled moments:
  - Scene 1 hook — one soft accent (e.g. a gentle drop/click) timed to the accent-period stamp.
  - Scene 2 typing — one soft key-tick as typing starts (not per character); a card "landing" sound exactly at the drop into In Progress.
  - Scene 3 completion — a bright success chime/bell exactly at the drop into Done, confetti given a very soft complementary swoosh under it.
  - Scene 4 outro — one restrained bell/chime under the logo lock; music fades out under it.
- SFX selection guidance: match the gesture — card/drop sounds for the card landing in a column, a success/bell family sound for the confetti payoff, a single soft key-tick for typing, a soft bong/bell for the final logo lock. Nothing aggressive, glitchy, or comedic — this is `polished` tone (2-3 very subtle SFX per the tone table in the media skill).
- SFX analysis guidance: use `hyperframes-media`'s SFX reference/analysis before picking exact files; prefer low high-frequency-risk sounds for repeated/polished moments.
- Exact SFX choice: choose exact filenames, timestamps, density, and volume once the animation timing is implemented.
- Audio files: copy the chosen music (and any chosen SFX) into `brag-output/composition/assets/`.

## Hyperframes Instructions
Use the current `hyperframes` skill family (`hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-media`, `hyperframes-cli`) and CLI workflow. Prefer native Hyperframes conventions over anything in this brief when they conflict on implementation mechanics.

Requirements:
- Show at least one real UI, copy, or visual element from the source project — the kanban board recreation in Scenes 2-3 is the anchor; do not replace it with an abstract diagram.
- Keep all text readable in the final render (respect the reading-time floors noted in `brag-plan.md`).
- Keep the video within 15-25 seconds (target 20s per the storyboard).
- Include the planned music/SFX layer.
- Treat the music cue metadata as optional timing hints, not a fixed cue sheet; choose exact SFX after the visual animation exists.
- Use only 1-3 strong cue locks in this video (the 4 candidates listed above are already a reasonable set — combine the two mid-scene ones if that reads cleaner).
- Honor the fade-out under the final logo card.
- When wiring the audio-reactive glow, follow the current Hyperframes audio-reactive workflow (in `hyperframes-creative`) to extract per-frame audio data; if extraction is unavailable, skip it and note that in the composition's `DESIGN.md` rather than blocking the render.
- Use local assets copied into `composition/assets/` — no absolute paths, no remote URLs.
- Run `hyperframes lint` and `hyperframes validate` and fix all errors before rendering; treat contrast issues below 3:1 (large text) / 4.5:1 (body text) as required fixes.
