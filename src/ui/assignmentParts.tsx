import { clipRange, clipSummary } from '../model/derived';
import { minutes, mmss } from '../model/format';
import type { Exercise, Question } from '../model/types';
import { AudioDrawer } from './audio';
import { Badge } from './Badge';
import { DrawerShell } from './Drawer';
import { useDrawer } from './drawerContext';
import { PLAY } from './media';
import { Field } from './rows';

// Pieces of an assignment shown the same way to the teacher and the student.

/** The exercise's material as one row: tap to watch, play, or read it all. */
export function MaterialRow({ e }: { e: Exercise }) {
  const drawer = useDrawer();
  if (e.kind === 'video') return <Field label="Video" value={clipSummary(e.material)} onClick={() => drawer.open(
    <DrawerShell title="Video to watch">
      <p>Watch {clipRange(e.material)} of <a href={e.material.url} target="_blank" rel="noreferrer">this video</a>.</p>
    </DrawerShell>)} />;
  if (e.kind === 'listen') return <Field label="Recording" value={e.material.audio ? `${PLAY} ${mmss(e.material.audio.duration)}` : 'Not recorded yet'}
    onClick={e.material.audio && (() => drawer.open(<AudioDrawer title="Audio to listen to" value={e.material.audio} readOnly autoPlay />))} />;
  if (e.kind === 'read') return <Field label="Text" value={<span className="clamp3">{e.material.text}</span>} onClick={() => drawer.open(
    <DrawerShell title="Text to read"><p style={{ whiteSpace: 'pre-wrap' }}>{e.material.text}</p></DrawerShell>)} />;
  return null;
}

/**
 * A question as one row: its text, and "▶ Audio 0:07" under it when it's heard; tap plays it.
 * The teacher always sees the text; a student sees only what the exercise gives them.
 */
export function QuestionRow({ e, q, n, forStudent = false }: { e: Exercise; q: Question; n: number; forStudent?: boolean }) {
  const drawer = useDrawer();
  const showText = !forStudent || e.questionMode !== 'hear';
  const audio = e.questionMode !== 'read' ? q.promptAudio : undefined;
  return <Field label="Question" value={<>
    {showText ? q.promptText : <>{PLAY} Hear the question {audio && mmss(audio.duration)}</>}
    {showText && audio && <><br /><small>{PLAY} Audio {mmss(audio.duration)}</small></>}
  </>} onClick={audio && (() => drawer.open(
    <AudioDrawer title={`Question ${n}`} value={audio} readOnly autoPlay>
      {showText && <p>{q.promptText}</p>}
    </AudioDrawer>))} />;
}

/** An answer's length against its target: "▶ 1:12 / target 1 min [Over target]". */
export function AnswerValue({ duration, target, none }: { duration?: number; target?: number; none: string }) {
  if (duration === undefined) return <>{none}{target ? ` / target ${minutes(target)}` : ''}</>;
  return <>{PLAY} {mmss(duration)}{target ? ` / target ${minutes(target)}` : ''}{target && duration > target && <> <Badge color="amber">Over target</Badge></>}</>;
}
