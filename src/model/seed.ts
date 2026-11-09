import type { Db } from './types';

/** Sample data, the same as prototype/teacher.html. */
export function seed(): Db {
  // a2 is mid-session: its current session began two minutes before the page loaded.
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  return {
    students: [
      { id: 's1', name: 'Noa Levi', className: 'Aleph', securityCode: 'K7P2', dateCreated: '2026-09-01' },
      { id: 's2', name: 'Itai Cohen', className: 'Aleph', securityCode: 'M3Q9', dateCreated: '2026-09-01' },
      { id: 's3', name: 'Maya Peretz', className: 'Aleph', securityCode: 'R8T4', dateCreated: '2026-09-02' },
      { id: 's4', name: 'Yonatan Mizrahi', className: 'Bet', securityCode: 'B2X6', dateCreated: '2026-09-03' },
      { id: 's5', name: 'Tamar Biton', className: 'Bet', securityCode: 'H5N1', dateCreated: '2026-09-03' },
    ],
    exercises: [
      {
        id: 'e1', title: 'Climate change interview', kind: 'video', status: 'published',
        timeLimit: 15, allowRerecord: true, dateCreated: '2026-10-01',
        material: { url: 'https://www.youtube.com/watch?v=abc123', start: '1:05', end: '3:20' },
        questions: [
          { id: 'q1', promptText: 'What is the main problem the speaker describes?', targetSeconds: 60 },
          { id: 'q2', promptText: 'Why does the speaker think young people should care?', targetSeconds: 60 },
          { id: 'q3', promptText: 'Do you agree with the speaker? Explain.', promptAudio: { path: 'fake-audio/q3.webm', duration: 9 }, targetSeconds: 120 },
        ],
      },
      {
        id: 'e2', title: 'My project', kind: 'speaking', status: 'published',
        allowRerecord: false, dateCreated: '2026-10-12', material: {},
        questions: [
          { id: 'q4', promptText: 'What is your project about?', promptAudio: { path: 'fake-audio/q4.webm', duration: 6 }, targetSeconds: 60 },
          { id: 'q5', promptText: 'How did the project influence you?', targetSeconds: 120 },
        ],
      },
      {
        id: 'e3', title: 'Weekend plans', kind: 'listen', status: 'draft',
        timeLimit: 10, allowRerecord: true, dateCreated: '2026-11-05',
        material: { audio: { path: 'fake-audio/e3.webm', duration: 95 } },
        questions: [{ id: 'q6', promptText: 'Where is the speaker going this weekend?', targetSeconds: 60 }],
      },
      {
        id: 'e4', title: 'A letter from camp', kind: 'read', status: 'draft',
        allowRerecord: true, dateCreated: '2026-11-08',
        material: { text: 'Dear Mom and Dad,\nCamp is great so far. On the first day we...' },
        questions: [],
      },
    ],
    assignments: [
      { id: 'a1', studentId: 's1', exerciseId: 'e1', dateAssigned: '2026-11-01', dueDate: '2026-11-10', state: 'submitted', secondsTaken: 812, dateStarted: '2026-11-03T15:10:00Z', dateSubmitted: '2026-11-04T16:02:00Z' },
      { id: 'a2', studentId: 's2', exerciseId: 'e1', dateAssigned: '2026-11-01', dueDate: '2026-11-10', state: 'active', secondsTaken: 300, dateStarted: '2026-11-08T14:00:00Z', resumedAt: twoMinutesAgo },
      { id: 'a3', studentId: 's3', exerciseId: 'e1', dateAssigned: '2026-11-01', dueDate: '2026-11-10', state: 'submitted', secondsTaken: 690, dateStarted: '2026-11-02T13:30:00Z', dateSubmitted: '2026-11-02T13:45:00Z' },
      { id: 'a4', studentId: 's4', exerciseId: 'e2', dateAssigned: '2026-11-03', dueDate: '2026-11-12', state: 'submitted', secondsTaken: 410, dateStarted: '2026-11-05T17:00:00Z', dateSubmitted: '2026-11-05T17:08:00Z' },
      { id: 'a5', studentId: 's5', exerciseId: 'e2', dateAssigned: '2026-11-03', dueDate: '2026-11-12', state: 'notStarted', secondsTaken: 0 },
      { id: 'a6', studentId: 's1', exerciseId: 'e2', dateAssigned: '2026-11-03', dueDate: '2026-11-12', state: 'paused', secondsTaken: 120, dateStarted: '2026-11-07T18:20:00Z' },
    ],
    answers: [
      ['a1', 'q1', 72], ['a1', 'q2', 48], ['a1', 'q3', 95],
      ['a2', 'q1', 55],
      ['a3', 'q1', 60], ['a3', 'q2', 58], ['a3', 'q3', 80],
      ['a4', 'q4', 70], ['a4', 'q5', 85],
      ['a6', 'q4', 40],
    ].map(([assignmentId, questionId, duration]) => ({
      assignmentId: assignmentId as string,
      questionId: questionId as string,
      recording: `fake-audio/${assignmentId}-${questionId}.webm`,
      duration: duration as number,
      dateRecorded: '2026-11-03T12:00:00Z',
    })),
    feedback: [
      {
        assignmentId: 'a3',
        overall: { text: 'Clear and well organized. Work on linking words.' },
        answerComments: { q1: { text: 'Good summary.' }, q3: { audio: { path: 'fake-audio/fb-a3-q3.webm', duration: 22 } } },
        status: 'published', dateStarted: '2026-11-03T09:00:00Z', datePublished: '2026-11-03T09:20:00Z',
      },
      {
        assignmentId: 'a4',
        overall: {},
        answerComments: { q4: { text: 'Nice detail about the robot.' } },
        status: 'draft', dateStarted: '2026-11-06T10:00:00Z',
      },
    ],
  };
}
