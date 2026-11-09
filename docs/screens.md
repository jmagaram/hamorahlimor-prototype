# Teacher screens

See `CLAUDE.md` for the UI model (header, footer, drawers, select mode, navigation stack). Every assignment row anywhere opens **Assignment detail**; every student name opens **Student detail**; every exercise title opens **Exercise detail**.

## 1. Home
A plain menu:
- Needs review (count), which opens Assignments
- Exercises, Students, Assignments, Classes

No footer.

## 2. Classes (list)
- Rows: class name, with the number of students under it.
- Tap a row to open a drawer listing that class's students (each a link to Student detail). The drawer has **Delete class** only when the class is empty; otherwise it shows a note to move the students first.
- Footer: `Add class`, which opens a drawer with a name field (required, unique).

## 3. Students (list)
- Grouped by class. Rows: name, with "N open assignments" under it.
- Footer: `Select` · `Add student`
  - Add student drawer: name and class. The security code is generated automatically.
- Select mode footer: `Cancel` · `Change class (N)` (option-list drawer) · `Delete (N)` (confirm drawer; also deletes their assignments).

## 4. Student detail
- Rows:
  - Name: input drawer
  - Class: option-list drawer
  - Security code: shown hidden; the drawer shows it large, with `Generate new code`
  - Created: read-only
- **Assignments**, grouped by display status. Rows: exercise title, with the due date under it.
- Footer: `Assign exercise`, which opens Assign (from a student).

## 5. Exercises (list)
- Grouped Draft / Published. Rows: title, with "kind · N questions · N assigned" under it.
- Footer: `Select` · `New exercise`
  - New exercise drawer: choose a kind (Video / Read and respond / Listen and respond / Speaking questions, each with a one-line description). This creates a draft and opens it.
- Select mode footer: `Cancel` · `Duplicate (N)`

## 6. Exercise detail
**Draft** (editable):
- Rows:
  - Title: input drawer
  - Kind: read-only
  - Material: opens the Material editor; not shown for Speaking
  - Time limit: option drawer, with No limit or 5/10/15/20/30 min
  - Re-recording: option drawer, Allowed or One take only
  - Status
- **Questions**: rows "1. prompt text", with "Audio prompt · Target 1:00" under them. Tap a row to open the Question editor. Below the list is a `+ Add question` link.
- Footer: `Delete` (confirm drawer) · `Publish`
  - Publish checks: at least one question, and material present for the kind. If something is missing, a drawer says what. Otherwise a confirm drawer explains that the exercise will be locked.

**Published** (locked):
- A note at the top: "Published: locked. Duplicate it to make changes."
- The same rows, not editable. Material and questions open their editors read-only.
- **Assigned to**: this exercise's assignments, grouped by display status. Rows: student name, with "class · due date" under it.
- Footer: `Duplicate` (creates a draft "Copy of …" and opens it) · `Assign`

## 7. Material editor (full page)
Depends on the kind:
- Video: YouTube URL, plus Start and End (blank means whole video)
- Read: a large text area
- Listen: Record / Play / Re-record / Remove, plus an optional "Text of the recording"

Footer: `Cancel` · `OK` (read-only when published: `Back`).

## 8. Question editor (full page)
- Prompt text
- Prompt audio (Record / Play / Re-record / Remove)
- Target answer length: No target, 0:30, 0:45, 1:00, 1:30, or 2:00

Validation: needs prompt text, audio, or both.

Footer: `Cancel` · `Delete` (existing questions only) · `OK` (read-only when published: `Back`).

## 9. Assign (full page)
**From an exercise:**
- Due date (default: one week from today)
- Students grouped by class. Ticking a class heading selects every student in that class. Students who already have this exercise are disabled and marked "already assigned".

**From a student:**
- Due date
- Published exercises as a radio list. Ones already assigned to this student are disabled.

Validation is inline. Footer: `Cancel` · `Assign`.

## 10. Assignments (list)
- Grouped by display status. Rows: "student · exercise", with "class · due date" under them.
- Footer: `Select`
- Select mode footer: `Cancel` · `Due date (N)` (date drawer) · `Unassign (N)` (confirm drawer; deletes answers and feedback).

## 11. Assignment detail
- Rows:
  - Student (link)
  - Exercise (link)
  - Status
  - Due: date drawer
  - Assigned, Started, Submitted
  - Time taken, e.g. "13:32 of 15:00"
- **Answers**: each question with its prompt and either `▶ Play` plus "1:12 / target 1:00 (over)", or "No answer yet". The teacher's comment shows under it if there is one.
- **Feedback**: Published (with date), Draft (with "student cannot see it"), or Not started, plus the overall comment.
- Footer: `Unassign` · then, if submitted, `Review`, `Continue review`, or `Edit feedback`.

## 12. Review (full page)
- Student and exercise at the top, with a note that the student sees nothing until it's published.
- For listen exercises, the recording text in a collapsible section.
- For each question:
  - the prompt (and its audio)
  - the student's answer: play, plus duration vs. target
  - a comment text area
  - an audio comment (Record / Play / Re-record / Remove)
- **Overall**: a comment text area and an audio comment.
- Footer: `Cancel` · `Save draft` · `Publish`. Both save buttons return to Assignment detail.
- When the feedback is already published, the footer is `Cancel` · `Publish` only: published feedback can't go back to draft.

## Drawers (summary)
Add class · class students/delete · add student · student name · class picker · security code · new-exercise kind · title · time limit · re-recording · due date · confirmations (publish, delete, unassign) · "can't publish yet".
