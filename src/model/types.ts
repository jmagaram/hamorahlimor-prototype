// Entities from docs/data-model.md. Keep field names in sync with that doc.

/** Calendar day, `YYYY-MM-DD`. */
export type DateString = string;
/** Point in time, ISO 8601. A Firestore Timestamp in the real app. */
export type Timestamp = string;
/** Path of an audio file. Cloud Storage later; a fake path in the prototype. */
export type AudioRef = string;
/** A recording the teacher made: the file and its length. */
export interface AudioClip {
  path: AudioRef;
  /** Seconds. */
  duration: number;
}

export interface Student {
  id: string;
  name: string;
  /** Free text for grouping students, e.g. "Aleph". Absent means no class. */
  className?: string;
  securityCode: string;
  dateCreated: DateString;
}

/** read: text only. hear: audio only (text is for the teacher). readAndHear: both. */
export type QuestionMode = 'read' | 'hear' | 'readAndHear';

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
  audio?: AudioClip;
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
  /** The question as text. Required to publish (the teacher grades against it); students see it unless questionMode is 'hear'. */
  promptText?: string;
  /** The question spoken. Required when questionMode includes hearing; not used in 'read' mode. */
  promptAudio?: AudioClip;
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
  /** How students get each question: read its text, hear its audio, or both. The teacher always sees the text. */
  questionMode: QuestionMode;
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
  /** Absent means no due date. */
  dueDate?: DateString;
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
  audio?: AudioClip;
}

/** A comment anchored to a moment in the student's answer. */
export interface TimedComment extends Comment {
  id: string;
  /** Where in the answer the teacher paused to comment, in seconds. */
  atSeconds: number;
}

/** The teacher's feedback on one answer. */
export interface AnswerFeedback {
  /** Sorted by atSeconds. */
  comments: TimedComment[];
  /** Sums up the whole answer; not tied to a moment. */
  overall: Comment;
}

export type FeedbackStatus = 'draft' | 'published';

/** Zero or one per assignment. */
export interface Feedback {
  assignmentId: string;
  /** On the whole assignment. */
  overall: Comment;
  /** Keyed by questionId. */
  answerFeedback: Record<string, AnswerFeedback>;
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
