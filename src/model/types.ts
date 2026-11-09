// Entities from docs/data-model.md. Keep field names in sync with that doc.

/** Calendar day, `YYYY-MM-DD`. */
export type DateString = string;
/** Point in time, ISO 8601. A Firestore Timestamp in the real app. */
export type Timestamp = string;
/** Path of an audio file. Cloud Storage later; a fake path in the prototype. */
export type AudioRef = string;

export interface Student {
  id: string;
  name: string;
  /** Free text for grouping students, e.g. "Aleph". Absent means no class. */
  className?: string;
  securityCode: string;
  dateCreated: DateString;
}

export type ExerciseKind = 'video' | 'read' | 'listen' | 'speaking';
export type ExerciseStatus = 'draft' | 'published';

export interface VideoMaterial {
  /** YouTube URL. Empty in a draft that hasn't set it. */
  url: string;
  /** Blank means the beginning. */
  start?: string;
  /** Blank means the end. */
  end?: string;
}
export interface ReadMaterial {
  /** Empty in a draft that hasn't set it. */
  text: string;
}
export interface ListenMaterial {
  /** Recorded by the teacher, always played whole. Absent in a draft that hasn't recorded it. */
  audio?: AudioRef;
  sourceText?: string;
}
export type SpeakingMaterial = Record<string, never>;

export interface MaterialByKind {
  video: VideoMaterial;
  read: ReadMaterial;
  listen: ListenMaterial;
  speaking: SpeakingMaterial;
}

export interface Question {
  id: string;
  /** At least one of promptText and promptAudio. */
  promptText?: string;
  promptAudio?: AudioRef;
  /** A goal for the answer's length, not a cutoff. */
  targetSeconds?: number;
}

interface ExerciseFields {
  id: string;
  title: string;
  status: ExerciseStatus;
  /** Minutes, for the whole exercise. */
  timeLimit?: number;
  allowRerecord: boolean;
  dateCreated: DateString;
  /** In order. One or more to publish. */
  questions: Question[];
}

export type ExerciseOf<K extends ExerciseKind> = ExerciseFields & { kind: K; material: MaterialByKind[K] };
export type Exercise = { [K in ExerciseKind]: ExerciseOf<K> }[ExerciseKind];

export type AssignmentState = 'notStarted' | 'active' | 'paused' | 'submitted';

export interface Assignment {
  id: string;
  studentId: string;
  exerciseId: string;
  dateAssigned: DateString;
  dueDate: DateString;
  state: AssignmentState;
  /** Set once, when the student first taps Start. */
  dateStarted?: Timestamp;
  /** Time accumulated over finished sessions. */
  secondsTaken: number;
  /** When the current session began. Absent while paused or submitted. */
  resumedAt?: Timestamp;
  dateSubmitted?: Timestamp;
}

/** Key: assignmentId + questionId. */
export interface Answer {
  assignmentId: string;
  questionId: string;
  recording: AudioRef;
  /** Seconds. */
  duration: number;
  dateRecorded: Timestamp;
}

/** Counts as a comment only with text, audio, or both. */
export interface Comment {
  text?: string;
  audio?: AudioRef;
}

export type FeedbackStatus = 'draft' | 'published';

/** Zero or one per assignment. */
export interface Feedback {
  assignmentId: string;
  overall: Comment;
  /** Keyed by questionId. */
  answerComments: Record<string, Comment>;
  status: FeedbackStatus;
  dateStarted: Timestamp;
  datePublished?: Timestamp;
}

/** The whole in-memory database. */
export interface Db {
  students: Student[];
  exercises: Exercise[];
  assignments: Assignment[];
  answers: Answer[];
  feedback: Feedback[];
}
