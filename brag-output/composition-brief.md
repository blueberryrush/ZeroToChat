# HyperFrames Composition Brief: Pixel Haven

## Objective
Create a short, polished launch/demo video for Pixel Haven that follows the built-in character-selection-to-cafe-to-booth flow.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 23.5 seconds

## Source Material
- Project root: `zerotochat/`
- Primary files read: `index.html`, `src/App.jsx`, `src/index.css`, `package.json`
- Product name: Pixel Haven
- Tagline / strongest claim: `COZY 16-BIT CITY & PROXIMITY CAFE`
- Key UI or visual moment to recreate: the arcade cabinet character selector, then the nighttime city, cafe VIP table, and two-seat dialogue booth.
- Copy that must appear verbatim:
  - `PIXEL HAVEN`
  - `COZY 16-BIT CITY & PROXIMITY CAFE`
  - `Choose your wanderer — hover to preview, click to lock in`
  - `Find the glowing cafe door`
  - `PIXEL CAFE · 24H BREW`
  - `Join VIP Table`
  - `COMETCHAT DIALOGUE TERMINAL`
- Data note: the displayed Alex/Maya dialogue is fictional sample copy and must carry a visible `SAMPLE CHAT` label. No secrets, real user data, live-connection indicators, or claims of a captured online session.

## Creative Direction
- Tone preset: default
- Creative direction: a warm arcade attract-mode for a tiny shared night out
- Interpretation: playful and polished, with a clear hook, a real app flow, brisk but readable reveals, and restrained arcade sound.
- Angle: use the actual game world as the story. The marquee invites a character choice, the character finds the cafe, and the VIP prompt leads to the source's dialogue terminal. The final booth conversation is staged from the built-in roster because CometChat credentials are not configured locally.
- Hook: open directly on the real Pixel Haven cabinet and the four distinctive pixel characters.
- Outro / punchline: the marquee returns with the exact project tagline.
- Avoid:
  - Generic SaaS language or unsupported metrics
  - Abstract filler visuals
  - Unrelated visual redesign
  - Suggesting CometChat is connected in this render

## Visual Identity
- Background: `#05060f`; selection backdrop `#0a0713`
- Text: `#fef3c7`
- Accent: spawn green `#22c55e`, marquee amber `#fcd34d`, character accents from `src/App.jsx`
- Display font: `Press Start 2P`
- Body font: `VT323` with monospace fallback
- Visual references from the project: arcade cabinet and marquee, hand-drawn SVG sprites, night skyline and shopfronts, amber streetlamps, warm cafe counter/pastry case, VIP booth chairs, steaming mugs, scanlines and vignette.

## Storyboard
Use `brag-plan.md` as the creative contract.

Scene summary:
1. The cabinet — 4s — show the real title, exact subtitle, all four source characters, and the spawn CTA.
2. Night walk — 4s — move Alex across the source-inspired street to the glowing cafe door.
3. The cafe — 4s — show the counter, pastry case, VIP table, and exact E / Join VIP Table prompt.
4. Booth & sample conversation — 8s — keep Alex, Maya, mugs, and terminal continuous; reveal a clearly labeled sample exchange after the 17.02s terminal cue.
5. Marquee — 3.5s — return to Pixel Haven and its verbatim tagline.

## Audio
- Audio role: warm, playful music bed with sparse, motion-matched UI accents
- Audio arc: gentle opening, forward motion through the city/cafe, warm booth reveal, soft final bell and fade.
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`
- Music treatment: approximately 0.32 volume; fade to silence over the final 0.5s.
- Music cue guidance: use the bundled preset at `assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`; target strong cues at 17.02s (booth/chat reveal) and 20.02s (marquee). The sample messages may land at 17.52s and 18.52s, then hold together. Readability wins over exact sync.
- Audio-reactive treatment: unavailable; the HyperFrames extraction helper needs Python plus NumPy, and Python is not installed in this environment. Document this and do not install more dependencies.
- Audio-coupled moments:
  - Character selection — one button press / low-risk click
  - Cafe approach — one soft footstep accent
  - Terminal reveal — one warm, low-risk impact
  - Marquee — one restrained logo bell
- SFX selection guidance: use the Brag SFX library and `assets/sfx/sfx-analysis.md`; favor low/medium HF-risk files, sparse accents, and motion-matched timing.
- Exact SFX choice: choose from the local library after the visual animation exists; copy only used files into `composition/assets/`.
- Audio files: all used music/SFX must be local under `composition/assets/`.

## HyperFrames Instructions
Build this as one standalone, seek-safe composition using the installed HyperFrames core/animation/creative/keyframes/CLI guidance. The branded application flow, source copy, tone, music, and staged-data disclosure are fixed by `brag-plan.md`; use HyperFrames-native timing and animation conventions for implementation.

Requirements:
- Show the actual project UI and source-grounded copy.
- Keep text readable at 1920x1080 and hold both sample chat lines together.
- Keep total duration at 23.5 seconds.
- Use the local bundled music and selected local SFX; narration is off.
- No paid API, account sign-in, CometChat credentials, remote publish, or cloud render.
- Keep the render local and document the unavailable optional audio-reactive extraction.
- Run `npx hyperframes check` before preview/render and fix all gating errors.