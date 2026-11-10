# Backlog

Ideas raised while building the prototype and deliberately left for later. Each is a real need someone mentioned, not a plan. When one is picked up, move its reasoning into `decisions.md` and delete it here.

## Teacher side

- **Exercise instructions.** A line or two for the student before they start, e.g. "Watch the clip twice, then answer." Might be one standard default rather than per exercise.
- **Tags for exercises.** The teacher's own groupings (e.g. "Bagrut clips", "More practice") once the library is long. Today there's search and a Show filter.
- **Grades.** A score per assignment or per answer, maybe against a rubric. Ask the teacher how she grades now before designing it. A natural place: an optional `grade` on the overall `Comment`s.
- **Faster reviewing.** "Next to review" (go from one submission straight to the next), or reviewing by question (every student's answer to question 2 in a row). Not yet known to be a problem.
- **Earlier attempts.** From an assignment, a link to the same student's earlier attempts at the same exercise, to compare.
- **Assignments filter.** On Assignments: Needs review · Not done · All, default Not done, once the list is long.
- **Text-to-speech.** Generate a listen-and-respond recording (or question audio) from text.
- **End of year.** Archive students and assignments; delete students' recordings.

## Student side

- **Full feedback screen.** The design in `audio-feedback-spec.md` (waveform with comment markers, replay before a comment, "heard" checks). The prototype has a simplified version.
- **Unread again after edits.** When a teacher changes feedback that's already published, the student isn't told (`dateSeen` stays set).
- **One take only.** An exercise setting for no re-recording, like the real exam. Removed until a teacher asks for it. If it returns: cancelling a first take must keep what was recorded, or students can retry by cancelling.

## Rules not decided yet

- **Due dates.** Today a due date only shows (and `Overdue`). Undecided: whether late work is allowed or closed, and whether anything happens at the due date. Teachers can unassign.
