import { useState } from 'react';
import { answerFor, feedbackFor } from '../model/derived';
import { mmss } from '../model/format';
import { newCommentId, updateFeedback, useDb } from '../model/store';
import type { Comment, TimedComment } from '../model/types';
import { back } from '../nav/nav';
import { AudioDrawer, Player } from '../ui/audio';
import { BACK, FORWARD, PAUSE, PLAY, useTicker } from '../ui/media';
import { ConfirmDrawer, DrawerShell, InputDrawer } from '../ui/Drawer';
import { useDrawer } from '../ui/drawerContext';
import { FeedbackRows } from '../ui/FeedbackRows';
import { Footer } from '../ui/Footer';
import { Empty, Field } from '../ui/rows';
import { NotFound } from './NotFound';

/** How far back the replay button goes. */
const STEP = 5;

/**
 * Feedback on one answer: play the answer, pause where you want to comment, and record or type there.
 * Simplified from the full spec (no waveform, no follow-scroll, no auto-resume).
 */
export function AnswerFeedback({ assignmentId, questionId }: { assignmentId: string; questionId: string }) {
  const db = useDb();
  const drawer = useDrawer();
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  /** While replaying the seconds before a pause point: that point, and how far back it went. */
  const [replay, setReplay] = useState<{ end: number; len: number } | null>(null);

  const a = db.assignments.find(x => x.id === assignmentId);
  const e = db.exercises.find(x => x.id === a?.exerciseId);
  const s = db.students.find(x => x.id === a?.studentId);
  const q = e?.questions.find(x => x.id === questionId);
  const answer = answerFor(db, assignmentId, questionId);
  const d = answer?.duration ?? 0;

  useTicker(playing, dt => {
    const p = pos + dt;
    if (replay && p >= replay.end) { setPos(replay.end); setPlaying(false); setReplay(null); }
    else if (p >= d) { setPos(d); setPlaying(false); }
    else setPos(p);
  });

  if (!a || !e || !s || !q || !answer) return <NotFound />;
  const first = s.name.split(' ')[0];
  const af = feedbackFor(db, assignmentId)?.answerFeedback[questionId];
  const comments = af?.comments ?? [];

  // A new comment goes where the teacher paused (during a replay, that's where the replay will stop).
  const anchor = Math.round((replay ? replay.end : pos) * 10) / 10;
  const pauseAt = (t: number) => { setPlaying(false); setReplay(null); setPos(t); };
  const togglePlay = () => {
    setReplay(null);
    if (!playing && pos >= d) setPos(0);
    setPlaying(!playing);
  };
  // Playing: back 5 s. Paused: play the 5 s before this point, then stop here again. Again during that: 5 s further back.
  const back5 = () => {
    if (replay) {
      const len = Math.min(replay.end, replay.len + STEP);
      setReplay({ end: replay.end, len });
      setPos(replay.end - len);
    } else if (playing) setPos(Math.max(0, pos - STEP));
    else if (pos > 0) {
      const len = Math.min(pos, STEP);
      setReplay({ end: pos, len });
      setPos(pos - len);
      setPlaying(true);
    }
  };
  const seek = (t: number) => { setReplay(null); setPos(Math.min(d, Math.max(0, t))); };

  const set = (c: { id: string; atSeconds: number }) => (fn: (x: Comment) => void) =>
    updateFeedback(assignmentId, { questionId, comment: c }, fn);
  const record = (c: { id: string; atSeconds: number }, title: string) => drawer.open(
    <AudioDrawer title={title} value={undefined} onChange={audio => set(c)(x => { x.audio = audio; })} />);
  const type = (c: { id: string; atSeconds: number; text?: string }, title: string) => drawer.open(
    <InputDrawer title={title} rows={4} initial={c.text ?? ''} onDone={v => set(c)(x => { x.text = v; })} />);

  const newAt = (fn: typeof record) => {
    pauseAt(anchor);
    fn({ id: newCommentId(), atSeconds: anchor }, `Comment at ${mmss(anchor)}`);
  };

  const open = (c: TimedComment, n: number) => {
    pauseAt(c.atSeconds);
    const title = `Comment ${n} at ${mmss(c.atSeconds)}`;
    drawer.open(<CommentDrawer title={title} c={c}
      onText={() => type(c, title)}
      onRecord={() => record(c, title)}
      onDelete={() => drawer.open(<ConfirmDrawer title={`Delete comment ${n}?`} confirmLabel="Delete"
        onConfirm={() => set(c)(x => { x.text = undefined; x.audio = undefined; })} />)} />);
  };

  return (
    <>
      {q.promptText && <p>{q.promptText}</p>}

      <h3>{first}'s answer</h3>
      <input className="scrub" type="range" min={0} max={d} step={0.1} value={pos} list="comment-marks"
        aria-label="Position" onChange={ev => seek(Number(ev.target.value))} />
      <datalist id="comment-marks">{comments.map(c => <option key={c.id} value={c.atSeconds} />)}</datalist>
      <p className="audio-time">{mmss(pos)} / {mmss(d)}{replay && ' · replaying'}</p>
      <div className="audio-row media">
        <button aria-label={playing && !replay ? `Back ${STEP} seconds` : `Replay the last ${STEP} seconds`} onClick={back5}>{BACK} {STEP}</button>
        <button aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>{playing ? PAUSE : PLAY}</button>
        <button aria-label={`Skip ${STEP} seconds`} onClick={() => seek(pos + STEP)}>{STEP} {FORWARD}</button>
      </div>
      <div className="audio-row">
        <button onClick={() => newAt(record)}>Record at {mmss(anchor)}</button>
        <button onClick={() => newAt(type)}>Type at {mmss(anchor)}</button>
      </div>

      <h3>Comments</h3>
      {comments.length
        ? comments.map((c, i) => (
          <Field key={c.id} label={`Comment ${i + 1} · at ${mmss(c.atSeconds)}`} value={<>
            {c.text && <span className="clamp3">{c.text}</span>}
            {c.audio && <div><small>{PLAY} Audio {mmss(c.audio.duration)}</small></div>}
          </>} onClick={() => open(c, i + 1)} />))
        : <Empty>Pause where you want to comment, then record or type.</Empty>}

      <h3>Overall comment</h3>
      <FeedbackRows assignmentId={assignmentId} place={{ questionId }} c={af?.overall ?? {}} what={`${first}'s whole answer`} />

      <Footer buttons={[{ label: 'Done', onClick: back }]} />
    </>
  );
}

/** One timed comment: its text and audio, and buttons to change them. Changes open their own drawers. */
function CommentDrawer({ title, c, onText, onRecord, onDelete }: {
  title: string; c: TimedComment; onText: () => void; onRecord: () => void; onDelete: () => void;
}) {
  const { close } = useDrawer();
  return (
    <DrawerShell title={title} actions={<>
      <button onClick={onDelete}>Delete</button>
      <button onClick={onText}>{c.text ? 'Edit text' : 'Add text'}</button>
      <button onClick={onRecord}>{c.audio ? 'Record again' : 'Add audio'}</button>
      <button onClick={close}>Done</button>
    </>}>
      {c.text && <p>{c.text}</p>}
      {c.audio && <Player clip={c.audio} autoPlay />}
    </DrawerShell>
  );
}
