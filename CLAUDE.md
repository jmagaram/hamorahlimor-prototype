# English practice app — teacher prototype

A web app for an English teacher in Israel. Students practice spoken English (modeled on the oral bagrut / COBE): they watch, read, or listen to material, then record spoken answers to questions. The teacher creates exercises, assigns them, and reviews answers with comments.

Two users: **teacher** and **student**. This phase builds a **click-through prototype of the teacher experience only**.

## Current phase: click-through prototype

- React + TypeScript, no backend. All data lives in memory, seeded with sample data, and resets on reload.
- **Plain HTML elements with browser default styles.** No UI library, no design system, no colors or fonts beyond defaults. CSS only for layout (the sticky header, fixed footer, drawer, and list rows), plus the link rule below, the audio drawer's red record/stop buttons and large timer, and the bordered cards and video placeholder on locked pages.
- Mobile-first: max width around 520px, centered on desktop.
- Audio is faked: no microphone or real playback. The record timer and playback position run on a clock, and a recording's length is however long you "recorded".
- `prototype/teacher.html` is the first version, a single HTML file. Use it as a behavior reference: same pages, same flows, same sample data.
- Keep the types in `src/model/types.ts` matching the **entities** in `docs/data-model.md` exactly (field names included), so they carry over to Firestore later. They follow the entity model, not the planned Firestore layout (no copied names, no subcollections).
- `teacher.html` uses older, shorter field names (`code`, `due`, `q.text`, ...). The data model's names win.

## Docs

- `docs/data-model.md`: entities, fields, relationships, rules, and the planned Firestore layout. **This is the source of truth.** If a UI change needs a model change, update this doc in the same change.

- `docs/decisions.md`: important decisions and the reasoning behind them, so they can be revisited later. Add an entry when a choice was debated or isn't obvious from the code.

Docs hold only guidelines that apply to the prototype as a whole, plus decision reasoning. Don't describe individual pages, buttons, or wording in docs: the code under `src/pages/` is the spec for each page, so change it directly.

## Code layout

- `src/model/`: `types.ts` (the entities), `seed.ts` (sample data), `store.ts` (in-memory store and all mutations), `derived.ts` (display status and other computed values).
- `src/nav/`: the navigation stack.
- `src/ui/`: the page frame (header, footer), drawers (`useDrawer` in `drawerContext.ts`), rows/fields, select mode (`useSelection`), fake audio widget.
- `src/pages/`: one component per page.

Commands: `npm run dev`, `npm run build` (type-checks), `npm run lint`.

## Naming (important)

- **Exercise**: the template the teacher writes (material + questions). Not "assignment" or "task".
- **Assignment**: one exercise given to one student, with a due date. It also holds the student's progress and timer.
- **Answer**: one student recording for one question on one assignment.
- **Feedback**: the teacher's comments on one assignment (overall + per answer), published as a whole.
- **Class**: e.g. "Aleph", "Bet". Optional free text on a student, used only to group students. Not an entity.

## UI model

Every page has the same frame:

- **Header** (sticky): the trail *above* the current page. A line of small clickable crumbs for everything above the parent (e.g. `Home › Exercises ›`), then a Back button labeled with the parent (e.g. `‹ Climate change interview`). There is no separate Home button: the `Home` crumb (or `‹ Home`) goes home. No header on Home.
- **Heading**: an `<h2>` at the top of the body says where you are and what you're doing. Each page chooses its own text: usually the page's title (`Aleph`), sometimes worded as a task (`Edit question 2`, `Assign Climate change interview`). The title (used in crumbs and Back) and the heading can differ; both live in `src/nav/titles.ts`.
- **Body**: the page content.
- **Footer** (fixed, optional): buttons within thumb reach. Each button is sized to its label, and leftover width is shared between them (`flex: 1 1 auto`). Disabled when the action can't apply.

Page types:

- **List page**: rows, optionally grouped under headings. A **Select** footer button enters select mode: rows get checkboxes, a "Select all · N selected" bar appears, and the footer switches to `Cancel` + bulk actions with counts, e.g. `Delete (3)`. Leaving the page exits select mode.
- **Detail page**: read-only rows (small label, value below, `›` when tappable). Tapping a row edits it, in a **drawer** for small edits or a **full editor page** for big ones.
- **Locked page** (a published exercise): read-only and compact. Settings are plain text lines, not tappable rows; the material and each question are cards, and a card with media opens a play-only drawer (which also shows its text).
- **Editor page**: a full-page form. Footer has `Cancel` and `OK`; both return to the previous page.
- **Drawer**: slides up from the bottom over a dimmed background. It has a title, then a single input, an option list, or a confirmation message, then `Cancel` / `OK` (or a labeled action like `Delete`). Use `OK` whenever tapping it applies the change; use `Done` only where changes are saved automatically and the button just closes. Validation errors show inline in the drawer. Tapping an option in an option list applies it and closes the drawer immediately.
- **Audio drawer** (`AudioDrawer`): every recording is set or played in it; the caller gives the title ("Question 2 audio"). With no recording: "Tap to record" and a red ● button; while recording, a large timer and a red ■ to stop (the background tap doesn't close it). Then a player: scrub slider, `0:02 / 2:42`, `⏪ 15` · `▶`/`⏸` · `15 ⏩` (media icons, each with an `aria-label`), and the drawer's buttons `Delete` · `Record again` · `Done` (Delete and Record again are confirmed in the drawer; read-only shows only `Done`). Changes save on Stop, so it closes with `Done`. Rows show a recording as "Recorded · 1:16".
- **Menu drawer** (`MenuDrawer`): a list of choices for setting a value. Each choice is a label, optionally with a short caption under it. One tap applies and closes; no Cancel button and no current-value marker (tap the dimmed background to dismiss).

Style:

- **Labels**: plain words on buttons and links, no symbols like `+` (`Add question`, not `+ Add question`). Exception: standard media icons on the audio player's controls (▶ ⏸ ⏪ ⏩) and the record/stop buttons.
- **Dates**: show calendar days with the weekday, `Tue 4-Nov` (`dayLabel`), not `2026-11-04`.
- **Counts**: don't show counts ("Draft (2)", "5 students") unless asked for. Lists are short and the teacher can see them. Bulk-action buttons in select mode keep theirs (`Delete (3)`).
- **Help text**: explanations about a setting go inside that setting's drawer (under its title), not on the page among the rows.
- **Links**: a link on its own, not inside a sentence (`Add question`, header crumbs), has no underline: use `ActionLink`. A link inside a sentence keeps the browser's underline.

Navigation:

- Navigation is a **stack** that the header renders (crumbs, then Back for the parent).
- Links go in every direction: student → assignment → exercise → another student, and so on. Every assignment row anywhere opens Assignment detail; every student name opens Student detail; every exercise title opens Exercise detail.
- If you navigate to a page that is already in the trail (same page and same params), cut the stack back to it instead of pushing a duplicate.
- No browser alerts or confirms. Use a drawer.
- Navigation is in memory only: the browser's back button and reload are not wired to it.

## Later phases (not now)

- Student experience prototype.
- Real app: Firebase (Firestore, Cloud Storage for audio, anonymous auth + student security codes).
- Possibly text-to-speech to generate listen-and-respond recordings from text.
