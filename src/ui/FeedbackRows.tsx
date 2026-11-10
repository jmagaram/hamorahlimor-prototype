import { audioSummary } from '../model/derived';
import { mmss } from '../model/format';
import { updateFeedback, type CommentPlace } from '../model/store';
import type { Comment } from '../model/types';
import { AudioDrawer } from './audio';
import { InputDrawer } from './Drawer';
import { useDrawer } from './drawerContext';
import { Field } from './rows';

/** Audio and written rows for one untimed comment (an overall one). Each saves right away. */
export function FeedbackRows({ assignmentId, place, c, what }: { assignmentId: string; place: CommentPlace; c: Comment; what: string }) {
  const drawer = useDrawer();
  const set = (fn: (c: Comment) => void) => updateFeedback(assignmentId, place, fn);
  return <>
    <Field label="Your audio feedback" value={audioSummary(c.audio, 'Not recorded')} onClick={() => drawer.open(
      <AudioDrawer title={`Audio feedback on ${what}`} value={c.audio} onChange={audio => set(x => { x.audio = audio; })} />)} />
    <Field label="Your written feedback" value={c.text ? <span className="clamp3">{c.text}</span> : 'None'} onClick={() => drawer.open(
      <InputDrawer title={`Written feedback on ${what}`} rows={8} initial={c.text ?? ''} onDone={v => set(x => { x.text = v; })} />)} />
  </>;
}

/** A teacher's comment shown on the page, for the student: its whole text, and a Play audio button that opens the player. */
export function CommentView({ c, title }: { c: Comment; title: string }) {
  const drawer = useDrawer();
  return <>
    {c.text && <p style={{ whiteSpace: 'pre-wrap' }}>{c.text}</p>}
    {c.audio && <p><button onClick={() => drawer.open(<AudioDrawer title={title} value={c.audio} readOnly autoPlay />)}>
      Play audio ({mmss(c.audio.duration)})</button></p>}
  </>;
}
