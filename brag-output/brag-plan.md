# Brag Plan: Pixel Haven

## What is this app?
Pixel Haven is a cozy 16-bit city where players choose a character, walk into a cafe, meet at its VIP booth, and chat through CometChat.

## The angle
Treat the actual game like a tiny, warmly lit place worth visiting: start at the arcade cabinet, follow one character from the night street into the cafe, then land on the two-seat booth and dialogue terminal. This is a source-faithful staged demo, not a recording of a live multiplayer session; the two short chat lines are clearly marked as sample copy.

## Hook (first 2-3 seconds)
The real character-select cabinet snaps into view under the PIXEL HAVEN marquee. Four distinct pixel characters appear, with Alex highlighted and the original "Choose your wanderer" prompt visible.

## Key moments (the middle)
- Alex moves through the night city toward the glowing cafe door; retain the source's moon, storefronts, street lamps, and pixel sprite style.
- The cafe's counter, pastry case, warm pendant lights, and VIP booth appear together. The E / Join VIP Table prompt motivates the next action.
- Two roster characters sit across steaming mugs in the booth. The CometChat dialogue terminal opens, followed by two short, fictional sample messages.

## Outro / punchline
Return to the amber marquee for PIXEL HAVEN and the exact tagline: "COZY 16-BIT CITY & PROXIMITY CAFE".

## User flow worth showing
Choose a wanderer and spawn → walk through the city to the cafe and press E at the VIP table → meet a second character in the synchronized booth and chat. The latter scenes are recreated from source because this checkout has no CometChat credentials; do not imply the rendered messages came from a live session.

## Tone
- Preset: default
- Creative direction: a warm arcade attract-mode for a tiny shared night out
- Interpretation: playful, clean, and specific; brisk scene cuts, restrained arcade clicks, and enough settled time to read every real UI label.

## Format: landscape — 1920x1080
## Duration: 23.5 seconds

## Visual identity (from the project)
- Background: #05060f; selection scene background #0a0713
- Accent: #22c55e for the spawn action, #fcd34d for the marquee, with character-specific accent colors
- Text: #fef3c7; secondary lavender #c4b5fd
- Display font: Press Start 2P
- Body font: VT323, with monospace fallback
- Strongest visual element: the amber arcade marquee above the four hand-drawn pixel characters; continue the same sprite, scanline, streetlamp, cafe, and steaming-mug vocabulary through the game flow.

## Share copy (draft)
Pixel Haven: a cozy 16-bit city with a cafe you can walk into and a VIP table to chat at.

## Audio direction
- Role: playful, polished music bed with sparse interaction accents
- Music: bundled `happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`
- Music treatment: start at 0s around 0.32 volume; keep the groove under the entire edit and fade to silence over the final 0.5s.
- Music cue guidance: bundled preset `happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`, estimated 120.19 BPM. Lock the booth reveal near 17.02s and the final marquee near 20.02s. Use the 17.52s and 18.52s grid points for the two sample chat lines, then hold both lines together. Keep cue timing subordinate to readability.
- Audio-reactive treatment: none. The supplied extraction helper requires Python and NumPy; Python is not installed here (the command resolves to the Windows Store alias). This limitation is documented rather than installing another dependency.
- SFX posture: sparse and motion-matched; low/medium high-frequency risk only.
- Audio-coupled moments: one selection click; a quiet cafe-entry accent; a warm terminal reveal; a restrained final logo bell.
- Restraint rule: no rapid keyboard chatter, loud arcade effects, or sound implying a real CometChat connection.

## Storyboard

### Scene 1 — The cabinet — 4s
The source character-select cabinet fills the frame: amber PIXEL HAVEN marquee, exact subtitle, four original roster names/titles and pixel avatars. Alex's selected border glows; the real spawn CTA presses once. The whole roster remains readable after the brief stagger.
Sequential/interaction: yes — reveal the four character cards as one compact wave, then simulate a single press on the spawn button; hold the full selection for at least 1.2s.
Audio intent: a light opening groove and one quiet button click.
Audio-coupled idea: the click lands with the button press; no per-character typing.
Music: upbeat, low and clean under the UI.
Transition mood: clean arcade cut → Scene 2

### Scene 2 — Night walk — 4s
Alex walks across the source-inspired city toward its glowing cafe door. Keep the skyline, moon, lit shopfronts, road, and lamp pools visible. Use the source hint "Find the glowing cafe door" as the sole callout.
Sequential/interaction: yes — move the same sprite continuously from street spawn to the cafe threshold; no fake cursor.
Audio intent: forward motion with one soft footstep accent.
Audio-coupled idea: let the footstep accent land on the walk, not on every step.
Music: continue the same bed.
Transition mood: warm doorway wipe → Scene 3

### Scene 3 — The cafe — 4s
Cut inside the source cafe: warm wood, pendant pools, espresso counter and pastry case. The sign reads "PIXEL CAFE · 24H BREW"; the VIP table is clearly in view. The E key and "Join VIP Table" prompt light up.
Sequential/interaction: yes — reveal the cafe sign and counter, then pulse the E prompt once as the avatar reaches the table.
Audio intent: cozy arrival; a soft UI accent, not a coffee-shop sound collage.
Audio-coupled idea: the prompt pulse and accent share one landing.
Music: continue; leave the center clear for the table.
Transition mood: brief hard cut on the E press → Scene 4

### Scene 4 — Booth & sample conversation — 8s
Recreate the source's cinematic booth: Alex and Maya sit opposite each other with two mugs, rising steam, warm spotlight, and a legible "COMETCHAT DIALOGUE TERMINAL" header. Do not show a "2 PLAYERS LINKED" status in this staged render.
Sequential/interaction: yes — both roster sprites settle into the seats at the start; reveal the terminal near 17.02s, then show a legible "SAMPLE CHAT" label and the fictional line "Alex › Hey, Maya." at 17.52s and "Maya › Seat's saved." at 18.52s. Hold both lines together until the cut.
Audio intent: the warmest, most satisfying reveal, with one low-risk soft impact; keep the music more present than the SFX.
Audio-coupled idea: the terminal reveal lands near the 17.02s strong cue, the two short lines use the 17.52s and 18.52s beat grid, and the pair holds together. No audio-reactive extraction is available.
Music: continue underneath; no voiceover.
Transition mood: dissolve to the marquee → Scene 5

### Scene 5 — Marquee — 3.5s
Land on PIXEL HAVEN in the original amber marquee treatment and hold the exact subtitle "COZY 16-BIT CITY & PROXIMITY CAFE". Let the final 1.5s breathe; finish on the settled title, not black.
Sequential/interaction: none.
Audio intent: a restrained logo bell over the music's final swell, then a short fade.
Audio-coupled idea: title lands near 20.02s; fade the music during the final 0.5s.
Music: fade to silence at the end.
Transition mood: settled hold → end

**Music mood for this video:** upbeat, warm arcade-night energy.
**Audio summary:** One clean groove carries the walk; a few soft UI/arrival accents mark the actions, and the final marquee rings once before the bed fades.