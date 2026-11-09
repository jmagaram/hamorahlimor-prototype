# Data model

## Diagram

```mermaid
erDiagram
  SCHOOL_CLASS ||--o{ STUDENT : contains
  STUDENT ||--o{ ASSIGNMENT : receives
  EXERCISE ||--o{ ASSIGNMENT : "assigned as"
  EXERCISE ||--o{ QUESTION : has
  ASSIGNMENT ||--o{ ANSWER : has
  QUESTION ||--o{ ANSWER : "answered by"
  ASSIGNMENT ||--o| FEEDBACK : has
  SCHOOL_CLASS {
    string name PK
  }
  STUDENT {
    string id PK
    string name
    string className FK
    string securityCode
    date dateCreated
  }
  EXERCISE {
    string id PK
    string title
    string kind "video, read, listen, speaking"
    object material "depends on kind"
    string status "draft, published"
    int timeLimit "minutes, optional"
    bool allowRerecord
    date dateCreated
  }
  QUESTION {
    string id PK
    string promptText "optional"
    file promptAudio "optional"
    int targetSeconds "optional goal"
  }
  ASSIGNMENT {
    string id PK
    string studentId FK
    string exerciseId FK
    date dateAssigned
    date dueDate
    string state "notStarted, active, paused, submitted"
    timestamp dateStarted
    int secondsTaken
    timestamp resumedAt
    timestamp dateSubmitted
  }
  ANSWER {
    string assignmentId PK, FK
    string questionId PK, FK
    file recording
    int duration
    timestamp dateRecorded
  }
  FEEDBACK {
    string assignmentId PK, FK
    object overall "Comment"
    map answerComments "questionId to Comment"
    string status "draft, published"
    timestamp dateStarted
    timestamp datePublished
  }
```

(The entity is called `SCHOOL_CLASS` in Mermaid only because `CLASS` is a reserved word there.)

Questions are embedded in their exercise (see Question below), so they have no `exerciseId` or `order` field: the parent is the exercise and the order is the array order. An exercise can have zero questions while it is a draft; it needs at least one to publish.

Types: `date` is a calendar day (`YYYY-MM-DD`). `timestamp` is a point in time (ISO 8601 in the prototype, a Firestore Timestamp later). The timer needs real timestamps.

## Entities

### Class
- `name`: required, and unique (ignoring case and surrounding spaces). It is the key; other records refer to a class by its name.
- Managed on its own Classes page.
- Not renamable for now (renaming would have to update every student). It can be deleted only when it has no students.

### Student
- `id`, `name`, `className`, `securityCode`, `dateCreated`
- `name`: required, and unique across all students (ignoring case and surrounding spaces).
- `securityCode`: a short code, generated automatically, that the student signs in with. The teacher can show it or generate a new one. Codes are unique across all students; a generated code that collides is regenerated.

### Exercise
The template. One structure for every kind: the material varies, and the questions work the same way.

- `id`, `title`, `kind`, `material`, `status`, `timeLimit?`, `allowRerecord`, `dateCreated`, `questions[]` (one or more to publish)
- `kind` and its `material`:

| kind | Label | Material |
|---|---|---|
| `video` | Video | `url` (YouTube), `start?`, `end?`. Blank start means the beginning; blank end means the end. |
| `read` | Read and respond | `text` |
| `listen` | Listen and respond | `audio` (recorded by the teacher, always played whole), `sourceText?` |
| `speaking` | Speaking questions | none |

- A draft can have incomplete material: an empty `url` or `text`, or no `audio`. Publishing requires them.
- `sourceText` on listen material: optional text of the recording. The teacher sees it while reviewing. Later it may be used to generate the audio with text-to-speech.
- `timeLimit`: for the whole exercise. One value on the exercise, with no per-assignment override. To get a different limit, duplicate the exercise.
- `allowRerecord`: if true, a student can re-record an answer before submitting, which overwrites it. If false, it's one take, like the real exam.

**Lifecycle:** `draft` is fully editable. `published` is **locked**, and only published exercises can be assigned. To change a published exercise, **Duplicate** it, which creates a new draft. Locking guarantees that students' answers always match the questions they answered.

### Question
- `id`, `promptText?`, `promptAudio?`, with at least one of the two prompt fields required
- `targetSeconds?`: a goal for the answer's length, not a cutoff. The student can record longer and sees that they went over.
- Stored inside its Exercise, in order; safe to embed because a published exercise never changes.

### Assignment
One exercise given to one student. It also holds the student's progress (there is no separate "work" or "submission" record, because there is exactly one response per assignment).

- `id`, `studentId`, `exerciseId`, `dateAssigned`, `dueDate`
- `state`: `notStarted` → `active` ⇄ `paused` → `submitted`
- Timer:
  - `dateStarted`: set once, when the student first taps Start.
  - `secondsTaken`: time accumulated over finished sessions.
  - `resumedAt`: when the current session began. Empty while paused or submitted.
  - Time taken right now = `secondsTaken` + (now − `resumedAt`) while `active`.
- `dateSubmitted`

### Answer
- Key: `assignmentId` + `questionId`, so there is at most one answer per question per assignment. Re-recording overwrites it.
- `recording` (audio file), `duration` (seconds), `dateRecorded`
- "Over target" means `duration` > the question's `targetSeconds`.

### Feedback
Zero or one per assignment; it exists once the teacher starts reviewing.

- `Comment` = `{ text?, audio? }`, with at least one of the two to count as a comment.
- `overall: Comment`
- `answerComments: { [questionId]: Comment }`, keyed by the same questionId as the Answer.
- `status`: `draft` | `published`. A single status for the whole thing: the student sees **nothing**, overall or per answer, until it is published. Once published it stays published: the teacher can edit and re-publish it (which updates `datePublished`), but cannot turn it back into a draft.
- `dateStarted`, `datePublished`
- Grades: not included yet. If needed later, add an optional `grade` to `Comment`, which covers both per-answer and overall grades.

## Display status of an assignment (derived, not stored)

| Status | Condition |
|---|---|
| Not started | `state = notStarted` |
| In progress | `state = active` |
| Paused | `state = paused` |
| Needs review | `state = submitted`, no Feedback |
| Feedback draft | `state = submitted`, Feedback is `draft` |
| Done | `state = submitted`, Feedback is `published` |

Lists of assignments are grouped in this order: Needs review, Feedback draft, In progress, Paused, Not started, Done.

## Planned Firestore layout (real app, not the prototype)

```
classes/{name}
students/{studentId}                     name, className, securityCode, dateCreated
exercises/{exerciseId}                   ...fields, material, questions[] embedded
assignments/{assignmentId}               studentId, exerciseId, dueDate, state, timer fields
                                         + copied studentName, exerciseTitle (for lists)
assignments/{id}/answers/{questionId}    audioPath, duration, dateRecorded
assignments/{id}/feedback/main           overall, answerComments, status, dates
```

- Copying the exercise title and student name onto assignments is safe because published exercises never change. (A student rename would need to update its assignments.)
- Feedback is a separate record so security rules can let a student read it only when `status == published`.
- Audio files go in Cloud Storage; records store the file paths.
- Auth: anonymous Firebase auth plus student security codes (to be designed).
