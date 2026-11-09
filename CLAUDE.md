# English practice app — teacher prototype

A web app for an English teacher in Israel. Students practice spoken English (modeled on the oral bagrut / COBE): they watch, read, or listen to material, then record spoken answers to questions. The teacher creates exercises, assigns them, and reviews answers with comments.

Two users: **teacher** and **student**. This phase builds a **click-through prototype of the teacher experience only**.

## Current phase: click-through prototype

- React + TypeScript, no backend. All data lives in memory, seeded with sample data, and resets on reload.
- **Plain HTML elements with browser default styles.** No UI library, no design system, no colors or fonts beyond defaults. CSS only for layout: the sticky header, fixed footer, drawer, and list rows.
- Mobile-first: max width around 520px, centered on desktop.
- Audio is faked. "Record" and "Play" buttons only toggle state; no microphone or real playback.
- `prototype/teacher.html` is the first version, a single HTML file. Use it as a behavior reference: same pages, same flows, same sample data.
- Keep the types in `src/model/types.ts` matching the **entities** in `docs/data-model.md` exactly (field names included), so they carry over to Firestore later. They follow the entity model, not the planned Firestore layout (no copied names, no subcollections).
- `teacher.html` uses older, shorter field names (`code`, `due`, `q.text`, ...). The data model's names win.

## Docs

- `docs/data-model.md`: entities, fields, relationships, rules, and the planned Firestore layout. **This is the source of truth.** If a UI change needs a model change, update this doc in the same change.
- `docs/screens.md`: every teacher page, what it shows, its footer buttons, and its drawers.

## Code layout

- `src/model/`: `types.ts` (the entities), `seed.ts` (sample data), `store.ts` (in-memory store and all mutations), `derived.ts` (display status and other computed values).
- `src/nav/`: the navigation stack.
- `src/ui/`: the page frame (header, footer), drawers (`useDrawer` in `drawerContext.ts`), rows/fields, select mode (`useSelection`), fake audio widget.
- `src/pages/`: one component per screen in `docs/screens.md`.

Commands: `npm run dev`, `npm run build` (type-checks), `npm run lint`.

## Naming (important)

- **Exercise**: the template the teacher writes (material + questions). Not "assignment" or "task".
- **Assignment**: one exercise given to one student, with a due date. It also holds the student's progress and timer.
- **Answer**: one student recording for one question on one assignment.
- **Feedback**: the teacher's comments on one assignment (overall + per answer), published as a whole.
- **Class**: e.g. "Aleph", "Bet". Identified by its name, with no separate ID.

## UI model

Every page has the same frame:

- **Header** (sticky): Home and Back buttons on the left, then a breadcrumb of the navigation trail, e.g. `Home › Exercises › Climate change interview`. Every crumb except the last is clickable. Home and Back are disabled on Home.
- **Body**: the page content.
- **Footer** (fixed, optional): buttons within thumb reach. Each button is sized to its label, and leftover width is shared between them (`flex: 1 1 auto`). Disabled when the action can't apply.

Page types:

- **List page**: rows, optionally grouped under headings. A **Select** footer button enters select mode: rows get checkboxes, a "Select all · N selected" bar appears, and the footer switches to `Cancel` + bulk actions with counts, e.g. `Delete (3)`. Leaving the page exits select mode.
- **Detail page**: read-only rows (small label, value below, `›` when tappable). Tapping a row edits it, in a **drawer** for small edits or a **full editor page** for big ones.
- **Editor page**: a full-page form. Footer has `Cancel` and `OK`; both return to the previous page.
- **Drawer**: slides up from the bottom over a dimmed background. It has a title, then a single input, an option list, or a confirmation message, then `Cancel` / `Done` (or a labeled action like `Delete`). Validation errors show inline in the drawer. Tapping an option in an option list applies it and closes the drawer immediately.

Navigation:

- Navigation is a **stack** that the breadcrumb renders.
- Links go in every direction: student → assignment → exercise → another student, and so on.
- If you navigate to a page that is already in the trail (same page and same params), cut the stack back to it instead of pushing a duplicate.
- No browser alerts or confirms. Use a drawer.
- Navigation is in memory only: the browser's back button and reload are not wired to it.

## Later phases (not now)

- Student experience prototype.
- Real app: Firebase (Firestore, Cloud Storage for audio, anonymous auth + student security codes).
- Possibly text-to-speech to generate listen-and-respond recordings from text.
