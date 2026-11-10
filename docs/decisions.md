# Decisions

Why things are the way they are. Newest first. Each entry: the decision, why, and what we gave up.

## Question text is required; the exercise decides how students get questions (2026-11-09, revised 2026-11-10)

**Decision.** Every question needs its text to publish. An exercise setting, `questionMode`, says how students get each question: **Read it** (text only, no question audio), **Hear it** (audio only; the text is for the teacher), or **Read and hear it** (both). When students hear questions, every question needs audio. Grading always shows the text.

**Revised 2026-11-10.** The first version had optional audio per question plus a yes/no "students see text". That allowed some questions with audio and some without in one exercise, and audio recorded on text-only exercises. Making audio all-or-nothing per exercise removes those cases.

**Why.** Grading against an audio-only question meant replaying it to remember what was asked. Treating the text as the question itself (not a separate "transcript") keeps one idea to explain, and later text-to-speech can generate the audio from it. Hiding text is a choice about the whole exercise, so it's one setting rather than a checkbox per question.

**Gave up / deferred.** Per-question hiding. Exercise "instructions" (guidance like "speak clearly") were discussed and deferred until the student side exists; guidance shouldn't go in question text.

## Review on Assignment detail, saved as you go (2026-11-09)

**Decision.** The separate Review page is gone. Assignment detail shows the exercise's material, then each question with its text and audio, the student's answer, and (once submitted) rows for your audio and written feedback; then overall feedback. Tapping a recording opens the player already playing. Every feedback change saves right away as a draft; `Publish` in the footer shows it to the student. After publishing, edits reach the student immediately (there's no second publish).

**Why.** Answers were on one page and feedback on another, so the teacher listened in one place and commented in another, without the question or material in view. Putting the question, the answer and your feedback together matches how a teacher grades one answer at a time, and rows with drawers replace a page of text boxes.

**Gave up.** No Cancel for a review session: changes save as you make them. Editing published feedback isn't staged; a typo fix goes straight to the student, which is usually what a teacher expects.

## Empty drafts and questions delete themselves (2026-11-09)

**Decision.** A draft is empty when its title is still the default, it has no material, and none of its questions has anything in it. A question is empty with no prompt text, no audio and no target. Leaving an empty one upward (Back, crumbs, Home) deletes it silently, and its Delete button skips the confirmation. Detection is on the navigation stack: when an exercise or question entry drops off the stack, it's checked (deepest first). Going down (to a question, the text editor) keeps it.

**Why.** Tapping New exercise or Add question and changing your mind left "Untitled video" or "No prompt yet" rows behind for the teacher to clean up. Nothing is lost by deleting them, so there's nothing to confirm.

**Gave up.** Time limit and re-recording don't count as content, so a draft with only those set is still deleted. They're two taps to redo, and counting them would let a stray tap keep junk drafts.

## Exercise kinds stay fixed; material is one section named for the kind (2026-11-09)

**Decision.** An exercise keeps one kind (video, listen, read, speaking), and its page has sections: General, then the material under a heading for the kind ("Video to watch", "Audio to listen to", "Text to read"; none for speaking), then Questions. The listen exercise's optional transcript (`sourceText`) was removed.

**Considered, not taken.** One generic "Background material" section where a teacher adds any mix of video, audio and text ("Add material" → pick a kind, at most one of each). It would make `material` a set of optional parts and drop `kind`, and it raises questions with no answers yet: the order students meet the parts in, what publishing requires, how the timer and student page handle every combination.

**Why.** The four kinds mirror the oral exam's task types, so one kind per exercise keeps it simple to make and to take. A heading named for the kind says what the material is and what the student does with it. The transcript was only for the teacher while reviewing and had no clear use yet.

**Gave up.** An exercise can't combine, say, a video and a text. If that becomes useful, the generic section above is the way to go.

## One audio drawer for recording and playback (2026-11-09)

**Decision.** Every recording is made and played in one drawer (`AudioDrawer`). It records with a red button and a large timer, then shows a player (slider, time, Back 15 / Play / Skip 15) with Record again and Delete. Changes save on Stop. A new take replaces the old one only when you stop it. Teacher recordings now store their length (`{ path, duration }`).

**Why.** Inline Record/Play buttons scattered across pages were small and inconsistent, and gave no sense of length or position. One drawer gives a big, thumb-friendly recorder and a real player, and the same control works for prompts, Listen material, feedback comments, and (later) student answers. Keeping the old take until Stop means "Record again" can't lose a recording by accident.

**Gave up.** Hearing a recording takes a tap to open the drawer. The red buttons and large timer are the one exception to "browser default styles".

## A question is a detail page, saved as you go (2026-11-09)

**Decision.** `Add question` creates an empty question in the draft and opens its page. The page has rows (Prompt text, Audio, Target length), each set in its own drawer and saved right away. There's no Cancel/OK for the page, only `Delete question`. Publishing checks that every question has prompt text or audio.

**Why.** It matches Exercise detail, where each property is its own row and drawer, and one tap edits one thing. Keeping unsaved changes until OK would mean a detail page with an editor's footer, mixing two page types.

**Gave up.** Backing out of a new question leaves it in the draft as "No prompt yet" (delete it, or publish will flag it). There's no Cancel that undoes several changes at once.

## Class is free text on Student, not an entity (2026-11-09)

**Decision.** Removed the Class entity and the Classes pages. `Student.className` is optional free text. The class picker offers the classes already in use, "No class", and a new name. Students are listed grouped by class A–Z (then "No class"), names A–Z within each group.

**Why.** Classes only exist to group students, for the Students list and for assigning work to a whole class (ticking a class heading on Assign). A separate entity brought its own pages, add/delete flows, uniqueness rules, and the "no classes yet" problem, all for a name.

**Gave up.** A class can't exist empty (it appears when its first student gets it). Renaming means changing every student in it (select the group, `Change class`). If classes ever need their own data (year, schedule, archiving), the entity has to come back.

## Navigation: crumbs + labeled Back, page heading in the body (2026-11-09)

**Decision.** No header on Home. Elsewhere the header shows small crumbs for everything above the parent, then a Back button labeled with the parent (`‹ Aleph`). The current page is named by an `<h2>` at the top of the body, and each page picks its own heading text (`Edit question 2`, `Assign to Itai Cohen`).

**Why.** The old header had a Home button, a Back button, and a full breadcrumb that included the current page. Because the breadcrumb is the navigation stack, Home duplicated the first crumb and Back duplicated the parent crumb: three ways to reach the same places. The 360px header also squeezed long titles. Moving the current title into the body gives it room to wrap and lets it describe the task, not just the place. Back stays as a real button because it's the most-used control and crumb links are small tap targets.

**Gave up.** The heading scrolls away on long pages (accepted for now). The parent's name appears only on the Back button, not as a crumb.

## Docs hold guidelines and decisions, not page specs (2026-11-09)

**Decision.** Deleted `docs/screens.md`. The code in `src/pages/` is the spec for each page.

**Why.** Every UI tweak had to be made twice, in code and in the per-page doc, which slowed down prototyping. Only prototype-wide rules (CLAUDE.md), the data model, and decision reasoning (this file) are worth keeping in docs.

## Timed comments on each answer (2026-11-10)

**Decision.** Feedback on an answer is a list of comments, each anchored to a moment in the student's answer (`atSeconds`) and holding audio, text, or both, plus one overall comment on the whole answer. It's edited on its own page. The assignment keeps its own overall comment. The full teacher and student design is in `docs/audio-feedback-spec.md`; the prototype builds a simplified version.

**Why.** A single block of feedback per answer made the teacher remember where things happened, and made the student hunt for them. Pausing and commenting right there means there's no mode switch, and the student can hear what they said just before each comment. Audio, text, or both: say a correction, and type the word when spelling matters.

**Gave up.** Simpler alternatives we considered: one text box and one recording per answer that the teacher adds to while listening, with an optional "[0:32]" inserted into the text. Timed comments cost a little more model and UI, but they're the shape the student screen needs.

**The real app follows the spec, not the prototype.** The prototype page only shows the flow. Missing from it: one-tap record/stop on the page (no drawer), "Resume after each comment", a list that follows playback, replaying the same window again, the "No overall comment" nudge on Done, the waveform with comment dots, play buttons with progress rings in the rows, and the student screen.

## Tap opens a page; multi-step flows use pickers (2026-11-10)

**Decision.** Tapping a thing always opens its page, and actions on it live on that page. Drawers are only for setting a value, small edits, confirmations, and quick looks. When a task needs you to pick something, it goes to a pick-mode page where one tap picks and returns. Assigning is one Assign page (Exercise section + Students section) reached from Assignments, an exercise, or a student, with the matching part preset; it replaced two separate Assign pages.

**Why.** We considered an action drawer on tap (Edit / Assign / Review…) to make multi-step flows lighter. But it makes every list a menu, adds a tap to the most common case (just open it), and makes taps unpredictable. The real difficulty was keeping a flow's choices while picking something, which page state solves. Assigning had only been possible from inside an exercise or a student; the Assignments list had no way to start one.

**Gave up.** Picking takes a page visit, not a drawer. A long list with a filter box works better on a page anyway (the phone keyboard and a drawer fight).

## Page state lives on the stack entry, not in URLs (2026-11-10)

**Decision.** Each navigation stack entry carries a small state bag (`usePageState`) for what the user has done on that page. It lasts while the entry is in the stack and is dropped when you leave it upward. Route params only say which page it is. Nothing goes in the URL.

**Why.** Pages reset their component state when you navigate, so a flow like Assign → Choose exercise → back lost the ticked students. Native apps keep pages underneath alive; this does the same. The app is installed on the home screen and nobody shares links to pages, so detailed URLs (or `?state=` keys into storage) would be plumbing with no benefit.

**Later (real app).** If the phone kills the app, it reopens at Home and an unfinished flow is lost; the stack could be saved to storage if that matters. Android's system back button triggers browser "back" in an installed web app and would close it, so mirror the stack into browser history with plain entries (`#1`, `#2`, …) that carry no details, and pop our stack on the browser's back event.

## No Done button on pages (2026-11-10)

**Decision.** Pages that save as you go have no `Done`; you leave with Back or the crumbs. Footers hold only actions on the page's thing. The draft exercise footer is `Delete · Publish`; the answer feedback page has no footer. Editor pages with unsaved input keep `Cancel` / `OK`, and drawers keep `Done` (a drawer has no Back).

**Why.** Done had been added to the draft exercise page for reassurance and copied to the feedback page, while other auto-saving pages (Assignment, Student, Question) had none. Done did exactly what Back does, so two controls for one thing invited "does Back lose my draft?". The Draft badge already says it's kept.

**Gave up.** Done was within thumb reach; Back is at the top. That's an app-wide concern to solve once (Android back button and swipe-back in the real app), not per page.

## Assigning an exercise again (2026-11-10)

**Decision.** A student can be assigned an exercise again once they've submitted the earlier one; while one is unfinished, Assign shows `Already assigned` and won't tick them. Repeats are told apart by the assigned day added to titles and rows (`· 10-Nov`), only when there's more than one.

**Why.** Teachers repeat the same oral exercise (e.g. a project check-in every couple of weeks). A second open copy is almost always a mistake, but redoing a finished one is legitimate. Each assignment already has its own id, answers and feedback, so no schema change. "Submitted" (not "feedback published") is the cutoff because it's when the student's part is done.

**Gave up.** We considered numbering repeats ("(2)"); the date is more meaningful to a teacher. Two repeats assigned on the same day would look alike (unlikely). Not yet: a link from an assignment to the student's earlier attempts, to compare answers over time.

## Assignment lists: flat, sorted, a badge per row (2026-11-10)

**Decision.** Assignments, an exercise's "Assigned to", and a student's assignments are one flat list each, not grouped under status headings. Each row has a colored status badge (plus `Overdue`) on its second line, then context and the relevant date ("submitted Wed 4-Nov" or "due Thu 12-Nov"). Order: Needs review (waited longest first), Feedback draft, overdue, the other unfinished ones by due date, Done last (newest first).

**Why.** Nested status headings (an h4 per status under "Assigned to") were busy to look at, and a row meant nothing without its heading. Badges make each row self-explaining and easy to scan by color; the sort order keeps "what needs me" at the top, which was the headings' real value.

**Later.** Assignments will grow to hundreds of mostly Done rows. Add a filter (Needs review · Not done · All, default Not done) when that matters.

## Sign in with a code; it's also how the prototype switches sides (2026-11-10)

**Decision.** Everyone signs in with a code: the teacher's or a student's. No signed-in user means the whole app is the sign-in screen. The header's top line says `Hi Noa`; tapping it confirms signing out and shows the code needed to get back in. Codes are 8 characters (`AZ54-93GW`). The prototype keeps the session in localStorage (so a reload keeps you signed in while the data resets) and adds "sign in as Teacher · Student" links.

**Why.** The real app uses Firebase anonymous auth with a code tying the anonymous user to a person, so this is the real flow, and it doubles as the way to switch between teacher and student while walking through the prototype. Showing the code on sign-out avoids students locking themselves out. 4-character codes were too easy to guess.

**Later decided (2026-11-10).** Many teachers, one role: any teacher can see and review all work, so there's no ownership on students or exercises.

## Student side: soft time limit, feedback under each answer (2026-11-10)

**Decision.** An exercise's time limit is a guide, not a cutoff: the student sees `0:54 of 5:00` in the small line above the title, and past the limit `0:10 over`; nothing stops or submits. While working there's no Back button (Pause or Submit, both back to Home) and no Overdue badge. On a submitted assignment the teacher's feedback sits right under each answer, with only the overall feedback at the end.

**Why.** More English practice is better even after the limit, and a big countdown or an Overdue badge while working is discouraging. Leaving through Pause makes stopping the clock explicit. Feedback next to the answer it's about is easier to follow than a separate feedback section.

**Not yet.** The full student feedback screen from `docs/audio-feedback-spec.md` (player with comment markers, replay before a comment, heard checkmarks).
