# English practice — prototype

A click-through prototype of an app for practicing spoken English, modeled on the oral bagrut (COBE). A teacher writes exercises (a video, a recording, a text, or just questions), assigns them to students, and reviews their recorded answers with timed comments. Students sign in with a code, do the exercise, and hear the feedback.

It's the spec for the real app, which will be built in a separate repo (see `docs/real-app.md`).

React + TypeScript + Vite, no backend: data is in memory, seeded with sample data, and resets on reload. Audio and timers are faked (nothing uses the microphone). Styling is deliberately the browser's defaults.

```bash
npm install
npm run dev
```

Open `/phone.html` (e.g. http://localhost:5173/phone.html) to see the app inside a 360×750 phone frame.

## Walking through it

- **Sign in** with a code, or use the links under the code box: **Teacher** or **Student**, each opens a list to pick from. "Hi Justin" at the top right signs out, which is also how you switch sides.
- **Teacher:** Home → Exercises (31 real practice clips plus a few samples), Students, Assignments. Open an assignment that **Needs review** and tap **Your feedback** on an answer to comment at moments in it; then **Publish**.
- **Students worth trying** (the student picker shows what each has):
  - **Noa Levi:** something paused, something waiting for feedback, and new feedback.
  - **Maya Peretz:** published feedback with timed comments on an answer.
  - **Itai Cohen:** an assignment in progress, with the clock running.
- Teacher and student share the same data, so a student's Submit shows up as Needs review for the teacher, and a teacher's Publish shows up as New feedback for the student (until you reload).

## Docs

- `CLAUDE.md`: what the app is, naming, the UI model and style rules, code layout. Start here.
- `docs/data-model.md`: entities, fields and rules, plus the planned Firestore layout. The source of truth.
- `docs/decisions.md`: decisions that were debated, and why.
- `docs/backlog.md`: ideas left for later.
- `docs/real-app.md`: what's decided for building the real app.
- `docs/audio-feedback-spec.md` and `docs/reference/`: the full design for timed audio feedback (the prototype builds a simpler version).
- `prototype/teacher.html`: the first single-file prototype, kept for reference.
