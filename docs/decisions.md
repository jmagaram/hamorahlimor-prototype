# Decisions

Why things are the way they are. Newest first. Each entry: the decision, why, and what we gave up.

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
