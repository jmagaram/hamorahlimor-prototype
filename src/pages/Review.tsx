import { useState } from 'react';
import { answerFor, feedbackFor } from '../model/derived';
import { saveFeedback, useDb } from '../model/store';
import type { Comment, Db, Feedback } from '../model/types';
import { back } from '../nav/nav';
import { AudioField, PlayButton } from '../ui/audio';
import { Footer } from '../ui/Footer';
import { AnswerLine } from './Assignments';
import { NotFound } from './NotFound';

export function Review({ id }: { id: string }) {
  const db = useDb();
  const a = db.assignments.find(x => x.id === id);
  if (!a || !db.exercises.some(e => e.id === a.exerciseId)) return <NotFound />;
  return <ReviewForm db={db} id={id} initial={feedbackFor(db, id)} />;
}

function CommentFields({ value, onChange, rows }: { value: Comment; onChange: (c: Comment) => void; rows: number }) {
  return (
    <>
      <p><label>Comment<br /><textarea rows={rows} value={value.text ?? ''} onChange={e => onChange({ ...value, text: e.target.value })} /></label></p>
      <p>Audio comment: <AudioField value={value.audio} onChange={audio => onChange({ ...value, audio })} /></p>
    </>
  );
}

function ReviewForm({ db, id, initial }: { db: Db; id: string; initial?: Feedback }) {
  const a = db.assignments.find(x => x.id === id)!;
  const e = db.exercises.find(x => x.id === a.exerciseId)!;
  const s = db.students.find(x => x.id === a.studentId);
  // Edits stay local until Save draft or Publish.
  const [overall, setOverall] = useState<Comment>(initial?.overall ?? {});
  const [comments, setComments] = useState<Record<string, Comment>>(initial?.answerComments ?? {});
  const published = initial?.status === 'published';

  const save = (status: Feedback['status']) => {
    saveFeedback(id, overall, comments, status);
    back();
  };

  return (
    <>
      <p>
        <b>{s?.name}</b> · {e.title}<br />
        <small>Feedback: {initial ? initial.status : 'not started'}. The student sees nothing until you publish.</small>
      </p>
      {e.kind === 'listen' && e.material.sourceText && (
        <details><summary>Recording text</summary><p>{e.material.sourceText}</p></details>
      )}
      {e.questions.map((q, i) => (
        <section key={q.id}>
          <hr />
          <h3>Question {i + 1}</h3>
          <p>{q.promptText}{q.promptAudio && <> <PlayButton /></>}</p>
          <p>Answer: <AnswerLine answer={answerFor(db, id, q.id)} question={q} none="No answer" /></p>
          <CommentFields rows={3} value={comments[q.id] ?? {}} onChange={c => setComments(cs => ({ ...cs, [q.id]: c }))} />
        </section>
      ))}
      <hr />
      <h3>Overall</h3>
      <CommentFields rows={4} value={overall} onChange={setOverall} />
      <Footer buttons={[
        { label: 'Cancel', onClick: back },
        ...(published ? [] : [{ label: 'Save draft', onClick: () => save('draft') }]),
        { label: 'Publish', onClick: () => save('published') },
      ]} />
    </>
  );
}
