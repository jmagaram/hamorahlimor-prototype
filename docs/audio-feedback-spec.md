# Audio feedback — teacher & student screens (spec)

Teacher records spoken feedback on a student's recorded English answer; the student listens to it.
Target: small iPhone screens. Student clips are usually ~30 s, at most 3 min. Teacher comments are short.

Reference prototypes (simulated audio, no real mic): `reference/TeacherFeedbackScreen.tsx`, `reference/StudentFeedbackScreen.tsx`
— self-contained React + TypeScript components (React only, inline styles). They implement every rule below and are
the behavior reference; replace the timer simulation with real `<audio>`/MediaRecorder and restyle with the app's components.
Screenshots: see `screenshots/` if present.

---

## Shared building blocks

**Student-answer player (top card, both screens)**
- Label row: left = state label, right = `0:15 / 0:48`.
- Waveform of the student's answer. Played part dark, unplayed light. Red playhead line.
- Comment markers: small dot above the waveform + thin blue line through it at each comment's timestamp. **Not tappable** (too small for fingers; the list handles jumping). Dots that overlap just merge visually.
- Drag anywhere on the waveform to scrub.
- Controls: `↺5` (round), big Play/Pause (round, center), `↻5` forward (round).

**The ↺ replay rule (one control, both screens)** — "let me hear that again, and put me back how I was":
- **Playing** → jump back 5 s and keep playing (ordinary back-5).
- **Paused** → play the 5 s before the playhead, then **stop back at the pause point**. The window is tinted light blue on the waveform while it plays.
- **Tap during a replay** → widen the window by 5 s (10, 15, …) and restart from the new start; still stops at the original point. Button shows `+5s` and a light-blue fill while replaying.
- **Tap after a replay has finished** (still at that point) → replay the **same** window length again. The tinted window stays visible while paused there.
- Window resets to 5 s after pressing Play, scrubbing, or moving to a different comment.

**Comment list**
- One rounded panel with thin dividers (iOS grouped-list style), not separate cards.
- Sorted by **timestamp in the student answer**, earliest first; overall comment last.
- Numbered by timeline order ("Comment 1…n"); "Overall comment" has no timestamp.
- Row: round play button (progress = ring filling around it while playing, no bar), title, `at 0:13` plain text.
- No per-row duration, no count or total in the header.
- **Tapping a comment's play button also moves the student playhead to that comment's timestamp** (paused). So "play comment → ↺" = hear what was said before it.
- **List follows playback**: auto-scrolls so the comment nearest the playhead is visible and tinted pale blue. If the user scrolls the list manually, following stops and a small **Follow playback** button appears in the header; Play/scrub/tap-comment also resumes following.

**Styling**
- Radius scale: buttons 8 px, cards/panels 12 px, small header button 6 px, icon buttons fully round.
- Row states are background tints: pale blue = nearest playhead; stronger blue = just saved / just played / active; pale red = recording or being re-recorded.
- Touch targets ≥ 44 px. Icons are stroke SVG, no emoji.

---

## Teacher screen

Header: back arrow, student name + "Video task · Question N". Question text below.
Footer (fixed): full-width **Done** (outlined, so it doesn't compete with the comment button).

**Big comment button** (full width, below the player). One tap starts recording; tap again saves.
Label changes with state:
- Playing → **Pause & comment** · "Noa pauses at 0:15"
- Paused, no comment at this spot → **Comment** · "At 0:15, where you paused"
- Paused at a spot that already has a comment (±0.5 s) → **Another comment here** · "Adds to comment 3 at 0:22"
- At end of answer → **Record overall comment** · "Sums up the whole answer"
- Recording → red **Stop & save** · "Recording 0:03 · Noa paused at 0:15"

**Comment anchor = the pause point.** If the teacher taps Comment during a ↺ replay, the replay stops, the playhead returns to the pause point and the comment is anchored there. During a replay a solid blue line marks the pause point (right edge of the tinted window).

Checkbox under the button: **Resume Noa's answer after each comment** (default on). On → after saving, student playback resumes. Off → stays paused at the same spot (button then reads "Another comment here").

**While recording, everything else is disabled and dimmed (~35%)**: player, ↺/↻, scrub, checkbox, all rows, Done, back arrow. Only Stop & save is active. A red "Recording at 0:15…" row appears **in its timeline position** in the list (not pinned to top). Possible later addition: Cancel (discard) next to Stop & save.

**After saving**: the new comment row is tinted strong blue for ~2.5 s and scrolled into view.

**Row actions**: play, **Redo** (plain mic icon — replaces that comment's audio, keeps its timestamp and number; no confirm, comments are short), **Delete** (trash).

**Done / back arrow**:
- If an overall comment exists → return to the previous screen (the existing per-student feedback summary, which has the Send button).
- If none → bottom drawer: **"No overall comment"** / "Add one to sum up Noa's answer?" with **No, I'm done** | **Add overall comment**. Add → closes drawer, moves playhead to end so the big button reads "Record overall comment".

---

## Text comments (audio, text, or both)

A comment is "something anchored to a moment in the student's answer". Its content is **audio, text, or both**
(`len > 0` = has audio; `text` optional). Every timeline rule above (anchor, ↺ replay, list order, follow-scroll) is unchanged.

- **Teacher creates text** with a square **Aa / Type** button beside the big mic button. It pauses at the current point
  (or the pause point, if mid-replay) and opens a bottom drawer: title "Text comment · at 0:15", textarea, **Cancel | Save**.
  At the end of the answer it opens the overall comment instead.
- **Row round button**: play/pause when the comment has audio; **Aa** when text-only (tapping it moves the playhead there, plays nothing).
  No special icon for "both" — the text shows under the title (2-line clamp on teacher screen, full text on student screen).
- **Teacher row actions**: mic (redo audio, or *add* audio to a text-only comment) · pencil (add/edit text) · trash.
  Clearing the text of an audio comment just removes the text; a comment with neither audio nor text disappears.
- **Student "heard"**: audio comments when the audio has played to the end; text-only comments as soon as they're tapped.
- Use case for "both": vocabulary/spelling — teacher says the correction and types the word.

---

## Student screen

Header: back arrow, "Feedback from your teacher", task/question. Question text below.
Nothing to record, redo or delete. No "try again" recording (students can practice aloud on their own).

- Top player = **the student's own answer only** (no stitched/interleaved track).
- Comment markers start **hollow**; become **filled** once that comment has been played to the end. Row gets a green check. Header shows "2 of 5 heard" (replaced by Follow playback when not following).
- Tapping a comment: plays it, moves playhead to its timestamp, row tinted, 5 s window tinted on the waveform, ↺ button tinted, label above waveform: **"Tap ↺ to hear what you said before Comment 2"**.
- ↺ follows the shared replay rule. Label during replay: "What you said before Comment 2" (or "Replaying" when not at a comment).
- Big Play continues the student's answer from the current point; the tint disappears once playback moves on.
- No separate "What was I saying?" buttons in rows — all student playback is centralized in the top player.

---

## Decided against (and why)

- **Stitched / "woven" combined track** (student audio interrupted by teacher comments): teacher often pauses mid-sentence, so the student hears half a sentence, comment, rest of sentence; students also want their answer uninterrupted. Dropped, along with the Send-screen combine options.
- **Teacher marking a time range per comment**: too much work per comment. Default 5 s context via ↺ is enough. Possible later: snap the window start to a silence/phrase boundary, and a draggable window edge — only if real use shows the need.
- **Numbered, tappable pins on the waveform**: too small to tap, overlap when close. Replaced by non-interactive dots.
- **Per-row duration, comment count, total time in header**: noise while commenting.
- **Separate "Last 5s" button and per-row replay chips**: duplicated ↺; unified into the one ↺ rule.

## Implementation notes

- Recording while playback is paused works in iOS Safari (MediaRecorder). Never record while student audio is playing (speaker bleed into mic).
- Store each comment as: `{ id, atSeconds, audioBlob/url, durationSeconds, isOverall }`; overall comment is unique per answer.
- "Heard" state is per student per comment.
