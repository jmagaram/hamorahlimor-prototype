import { useState } from 'react';
import { KINDS } from '../model/derived';
import { mmss } from '../model/format';
import { deleteQuestion, saveQuestion, updateDraft, useDb } from '../model/store';
import type { AudioRef, Exercise } from '../model/types';
import { back } from '../nav/nav';
import { AudioField } from '../ui/audio';
import { ConfirmDrawer } from '../ui/Drawer';
import { useDrawer } from '../ui/drawerContext';
import { Footer, type FooterButton } from '../ui/Footer';
import { NotFound } from './NotFound';

const editorFooter = (readOnly: boolean, ok: () => void, extra: FooterButton[] = []): FooterButton[] =>
  readOnly ? [{ label: 'Back', onClick: back }] : [{ label: 'Cancel', onClick: back }, ...extra, { label: 'OK', onClick: ok }];

/* ---------- Material ---------- */

export function Material({ id }: { id: string }) {
  const e = useDb().exercises.find(x => x.id === id);
  if (!e) return <NotFound />;
  return <MaterialForm e={e} />;
}

function MaterialForm({ e }: { e: Exercise }) {
  const ro = e.status !== 'draft';
  // Form state starts from the saved material and is written back only on OK.
  const [url, setUrl] = useState(e.kind === 'video' ? e.material.url : '');
  const [start, setStart] = useState(e.kind === 'video' ? e.material.start ?? '' : '');
  const [end, setEnd] = useState(e.kind === 'video' ? e.material.end ?? '' : '');
  const [text, setText] = useState(e.kind === 'read' ? e.material.text : '');
  const [audio, setAudio] = useState<AudioRef | undefined>(e.kind === 'listen' ? e.material.audio : undefined);
  const [sourceText, setSourceText] = useState(e.kind === 'listen' ? e.material.sourceText ?? '' : '');

  const ok = () => {
    updateDraft(e.id, x => {
      if (x.kind === 'video') x.material = { url: url.trim(), ...(start.trim() && { start: start.trim() }), ...(end.trim() && { end: end.trim() }) };
      if (x.kind === 'read') x.material = { text };
      if (x.kind === 'listen') x.material = { ...(audio && { audio }), ...(sourceText.trim() && { sourceText }) };
    });
    back();
  };

  return (
    <>
      <p><small>{e.title} · {KINDS[e.kind].label}</small></p>
      {e.kind === 'video' && <>
        <p><label>YouTube URL<br /><input className="wide" type="text" disabled={ro} value={url} onChange={ev => setUrl(ev.target.value)} /></label></p>
        <p>
          <label>Start <input size={6} placeholder="0:00" disabled={ro} value={start} onChange={ev => setStart(ev.target.value)} /></label>{' '}
          <label>End <input size={6} placeholder="end" disabled={ro} value={end} onChange={ev => setEnd(ev.target.value)} /></label>
        </p>
        <p><small>Leave start or end blank to use the whole video.</small></p>
      </>}
      {e.kind === 'read' && (
        <p><label>Text students read<br /><textarea rows={14} disabled={ro} value={text} onChange={ev => setText(ev.target.value)} /></label></p>
      )}
      {e.kind === 'listen' && <>
        <p>Recording: <AudioField value={audio} onChange={setAudio} readOnly={ro} /></p>
        <p><label>Text of the recording (optional)<br /><textarea rows={6} disabled={ro} value={sourceText} onChange={ev => setSourceText(ev.target.value)} /></label></p>
        <p><small>Shown to you while reviewing. Later: generate the recording from this text.</small></p>
      </>}
      <Footer buttons={editorFooter(ro, ok)} />
    </>
  );
}

/* ---------- Question ---------- */

const TARGETS = [0, 30, 45, 60, 90, 120];

export function QuestionEditor({ exerciseId, questionId }: { exerciseId: string; questionId?: string }) {
  const e = useDb().exercises.find(x => x.id === exerciseId);
  const q = questionId ? e?.questions.find(x => x.id === questionId) : undefined;
  if (!e || (questionId && !q)) return <NotFound />;
  return <QuestionForm e={e} questionId={questionId} />;
}

function QuestionForm({ e, questionId }: { e: Exercise; questionId?: string }) {
  const drawer = useDrawer();
  const q = e.questions.find(x => x.id === questionId);
  const ro = e.status !== 'draft';
  const [text, setText] = useState(q?.promptText ?? '');
  const [audio, setAudio] = useState(q?.promptAudio);
  const [target, setTarget] = useState(q?.targetSeconds ?? 0);
  const [error, setError] = useState('');

  const ok = () => {
    if (!text.trim() && !audio) return setError('Add prompt text, a recording, or both.');
    saveQuestion(e.id, { id: questionId, promptText: text.trim(), promptAudio: audio, targetSeconds: target });
    back();
  };
  const del: FooterButton[] = questionId ? [{
    label: 'Delete',
    onClick: () => drawer.open(<ConfirmDrawer title="Delete this question?" confirmLabel="Delete"
      onConfirm={() => { back(); deleteQuestion(e.id, questionId); }} />),
  }] : [];

  return (
    <>
      <p><small>{e.title}</small></p>
      <p><label>Prompt text<br /><textarea rows={4} disabled={ro} value={text} onChange={ev => setText(ev.target.value)} /></label></p>
      <p>Prompt audio: <AudioField value={audio} onChange={setAudio} readOnly={ro} /></p>
      <p><label>Target answer length<br />
        <select disabled={ro} value={target} onChange={ev => setTarget(Number(ev.target.value))}>
          {TARGETS.map(v => <option key={v} value={v}>{v ? mmss(v) : 'No target'}</option>)}
        </select>
      </label></p>
      <p><small>A goal, not a cutoff. Students see when they go over.</small></p>
      {error && <p className="err">{error}</p>}
      <Footer buttons={editorFooter(ro, ok, del)} />
    </>
  );
}
