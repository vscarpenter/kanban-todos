# Brag Plan: Cascade

## What is this app?
Cascade is a kanban task manager that runs entirely in the browser — no account, no server, no tracking — and still feels as smooth and satisfying as any SaaS product (drag-and-drop columns, progress tracking, confetti on completion).

## The angle
Most "privacy-first" apps ask you to take their word for it. Cascade's own copy doesn't even call it a promise — it calls it "an architectural fact." The video proves that line: show the product actually working (typing a task, dragging it across the board, confetti on completion), then land on the deadpan claim that there's no server behind any of it.

## Hook (first 2-3 seconds)
Real product copy, not marketing spin: **"Own your data."** in large serif type on the warm ivory background, the accent-indigo period landing like a stamp. Confident, quiet, a little defiant.

## Key moments (the middle)
- A task title typing itself into the "To Do" column and the card sliding in (`card-enter` animation already in the app).
- That same card being dragged across the board, To Do → In Progress → Done — the actual `@dnd-kit` drag interaction, not a diagram of it.
- The real confetti burst + "Task completed" toast that fires today in `celebrateTaskCompletion()` the moment a task lands in Done.

## Outro / punchline
Cut to dark mode. Two lines from the app's own Privacy section settle one after another: **"This isn't a privacy policy."** / **"It's an architectural fact."** Then the Cascade wordmark, icon, and `cascade.vinny.dev` land as the closing card, with "No account. No server. No tracking." underneath.

## User flow worth showing
1. **Entry** — the real three-column board (To Do / In Progress / Done) with status dots (blue / amber / olive), a task typed into "Add Task."
2. **Key action** — the card dragged across columns via the actual drag gesture.
3. **Result** — confetti + toast firing as the card drops into Done.

## Tone
- Preset: polished
- Creative direction: quiet-confidence product film — prove the privacy claim by showing the app actually work, then land the deadpan "architectural fact" line without winking at the camera.
- Interpretation: Few scenes, longer holds, restrained motion. Energy comes from the drag-and-drop and confetti payoff being real and satisfying, not from fast cuts or loud type. No jokes, no irony — the humor (if any) is in how seriously the app takes a task manager not phoning home.

## Format: landscape — 1920x1080
## Duration: ~29s (9.0s About-screen intro + the original 20s app cut, which rendered at 22.2s)

**Revision note (post-first-cut):** user approved the original 20s app cut in full and asked to prepend an 8-10s tour of the real About/landing screen's features before it — "then the rest is perfect." Scenes 1-4 below (Hook → Reveal+flow → Completion+confetti → Punchline/outro) are the untouched, approved cut. Scene 0 is new and plays first.

## Visual identity (from the project)
- Background: `#F4F4F0` (ivory, light) / `#0F1018` (near-black, dark)
- Accent: `#3B4A8C` indigo (light) / `#7A8AD1` periwinkle (dark)
- Text: `#13141B` slate (light) / `#E8E8EE` (dark)
- Display font: `ui-serif, Georgia, "Times New Roman", Times, serif` (headings)
- Body font: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Strongest visual element: the real kanban board itself — paper task cards with 1.5px hairline borders and soft shadow on a stone-gray column, status dots in indigo/amber/olive, plus the confetti burst on task completion.

## Share copy (draft)
Cascade is a kanban board that never talks to a server. No account, no sync, no tracking — just tasks that stay on your device. It's not a privacy policy, it's architecture. 🗂️

## Audio direction
- Role: warm, restrained bed with a couple of motion-matched accents — polished, not chaotic.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady/clean, recommended for `polished`/`cinematic`).
- Music treatment: **start when Scene 1 begins (composition t=9.0s with the new About intro), not at t=0.** Volume ~0.30, gentle throughout, small swell under the confetti beat, fade under the final logo card. Starting the score exactly at Scene 1 preserves every beat-lock timestamp below byte-for-byte from the approved cut — the About intro (Scene 0) gets only light SFX, no score, so nothing about the approved back half needs re-tuning.
- Music cue guidance: bundled preset found at `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`, tempo ≈109.96 BPM. Target strong cues: **8.74s** (card lands in In Progress), **13.11s** (card lands in Done / confetti), **17.47s or 18.56s** (second punchline line settles), **19.66s** (logo card lock near the end). Beat grid is dense enough (~0.55s spacing) that these are the only locks needed — do not chase every beat.
- Audio-reactive treatment: subtle; the accent-indigo glow behind the hook headline and the logo card may breathe slightly with RMS. No waveform/equalizer visuals.
- SFX posture: minimal but present — 3-4 tasteful cues, nothing aggressive, per the `polished` tone table in `audio.md`.
- Audio-coupled moments: card drop into a column, confetti burst, final logo lock.
- Restraint rule: no comedic or chaotic SFX (no glitch, no error buzz); skip a sound for every typed character — at most one soft key-tick to imply typing, not a per-letter clatter.

## Storyboard

### Scene 0 — About-screen feature tour (NEW) — 9.0s (0.0-9.0s)
Recreate the real About/landing page (`src/components/about/FeaturesSection.tsx`), ivory background. The "FEATURES" eyebrow label (11px mono, uppercase, tracked, per `.label-eyebrow`) and the real heading "Everything a task manager needs. Nothing it doesn't." settle first (accent-indigo periods) — hold long enough to read (~2.2s). Then four real feature cards stagger into a 2x2 grid, each with its real Lucide icon, title, and description verbatim from the source:
  1. **Multiple Boards** — "Separate boards for every project, client, or area of life. Unlimited." (Columns3 icon)
  2. **Search and Filters** — "Filter by text, tags, priority, status, or overdue. Find anything in seconds." (Search icon)
  3. **Keyboard Shortcuts** — "Press H to see all shortcuts. Power users welcome." (Keyboard icon)
  4. **PWA Ready** — "Install on desktop or mobile. Offline support built in. No app store needed." (Smartphone icon)
Chosen deliberately as the four features NOT already demonstrated later in the video (drag-and-drop, progress, privacy, and completion are all covered live in Scenes 1-3 and the Scene 4 punchline) — this scene is about breadth, the rest of the video is about depth on one flow. Hold the full grid on screen so all four are readable, then soft-crossfade the grid into Scene 1's ivory "Own your data." stamp — the about page's own promise becomes the pivot line into the live app.
Sequential/interaction: yes — heading settles, then the 4 cards stagger in (~0.2-0.25s apart), then hold as a set
Audio intent: light, inviting, browsing-a-real-site energy — quieter than the app-flow scenes, this is the "before" half
Audio-coupled idea: a soft card-place/click tick on each of the 4 cards as they land (reuse the same restrained SFX family as the rest of the video, e.g. `click-soft`), nothing on the heading itself
Music: **do not** start the main score here — see Audio direction below for why. A very quiet, optional ambient bed or silence-but-for-SFX is fine; the main track starts exactly at the Scene 1 cut so every beat-lock already tuned in Scenes 1-4 stays correct untouched.
Transition mood: soft crossfade (grid dissolves into the big serif headline) → Scene 1

### Scene 1 — Hook — 3.0s
Ivory background. Serif headline "Own your data" fades/slams in fast, then holds; the accent-indigo period stamps in a beat after the words settle (~2.2-2.7s). A faint hairline card-frame ghost sits behind the type, teasing the product without revealing it yet.
Sequential/interaction: none
Audio intent: quiet confidence — a single soft accent when the period lands, nothing before it
Audio-coupled idea: one subtle SFX (e.g. a soft drop/click) timed to the period stamp, aligned near the 2.19-2.73s beat window
Music: bed fades in under the headline, low volume
Transition mood: soft crossfade → Scene 2

### Scene 2 — Reveal + flow (add & drag) — 6.5s (3.0-9.5s)
Cut to the real Cascade board, light theme: three columns (To Do / In Progress / Done) with status dots, cascade-icon + "Cascade" wordmark small top-left. Cursor clicks "Add Task" in To Do; a short task title types out (e.g. "Ship the launch video") — hold long enough to read once fully typed (~1.2s settled). The card slides in with its existing `card-enter` animation. Cursor then grabs the card and drags it across into In Progress, landing right on the 8.74s strong cue.
Sequential/interaction: yes — title types out, then the card is dragged (real `@dnd-kit` drag gesture) from To Do into In Progress
Audio intent: light, alive, not busy — the board feels real
Audio-coupled idea: one soft key-tick as typing starts (not per character), a card "landing" sound exactly at the drop into In Progress (~8.74s)
Transition mood: clean cut → Scene 3

### Scene 3 — Completion + confetti — 5.0s (9.5-14.5s)
Same card is dragged again, In Progress → Done, landing on the 13.11s strong cue. On drop: confetti bursts from the drop point and the "Task completed" toast slides in. Hold on the satisfied board (Done column, card, toast) for the back half of the scene so the payoff registers.
Sequential/interaction: yes — drag-drop into Done, followed by confetti + toast reveal
Audio intent: the emotional peak of the video — genuinely satisfying, not silly
Audio-coupled idea: a bright success chime/bell exactly at the 13.11s drop, confetti given a very soft complementary swoosh under it (not layered loud)
Transition mood: hard cut to dark → Scene 4

### Scene 4 — Punchline / outro — 5.5s (14.5-20.0s)
Cut to dark mode (near-black `#0F1018` background, periwinkle `#7A8AD1` accent). Line one settles: "This isn't a privacy policy." Beat. Line two settles: "It's an architectural fact." — timed to land around the 17.47-18.56s strong cue window. Cascade wordmark + icon + "cascade.vinny.dev" fade in as the closing card, with "No account. No server. No tracking." underneath, locking near the 19.66s strong cue.
Sequential/interaction: yes — two lines reveal one after another, then the logo card
Audio intent: resolve — music settles, the video ends on quiet confidence, not a sting
Audio-coupled idea: one restrained bell/chime under the logo lock (~19.66s); music fades out under it
Music: fades out through the final second
Transition mood: — (end)

**Music mood for this video:** polished / steady and clean, business-warm without being generic corporate.
**Audio summary:** A calm, confident bed carries the whole video; the only accents are the two card-drop sounds, the confetti success chime, and a single closing bell under the logo — every one of them timed to a real strong beat in the track, so the polish feels intentional rather than decorative.
