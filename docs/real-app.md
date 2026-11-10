# Building the real app

The prototype in this repo is the spec. The real app is built in a **new repo**: copy the entity types (`src/model/types.ts`, matching `data-model.md`) and the UI patterns, not the fake store or the sample data.

What's decided so far:

- **Everything ships at once.** Teacher side, student side, sign-in, timed feedback: all of what the prototype shows.
- **Look: deliberately unstyled,** like the prototype (browser defaults, CSS only for layout and a few named exceptions; see CLAUDE.md "Style"). Styling gets added piece by piece later.
- **Firebase.** Firestore for data (layout at the end of `data-model.md`), Cloud Storage for audio, anonymous auth plus a sign-in code that links the user to a teacher or a student.
- **Teachers.** Any number, one role. Every teacher can see and review all students' work; nothing is owned by a teacher. (Adding and removing teachers needs a way in; the prototype has none.)
- **Security.** Not a concern for now.
- **Audio.** Recording, upload and playback are solved separately (by the owner).
- **Installed web app.** No offline support, but encourage installing it on the home screen (a web app manifest and an install hint). Because the app's own navigation stack is in memory, Android's back button needs wiring: mirror the stack into browser history with plain entries (see `decisions.md`, "Page state lives on the stack entry").
- **Language.** English now. Some Hebrew may be needed (not decided), so keep visible text easy to find and replace, and don't rule out right-to-left.

Still open:

- **YouTube.** Some videos don't allow embedding; the clip's start and end must be applied by the player.
- **Ideas for later** are in `backlog.md`.
