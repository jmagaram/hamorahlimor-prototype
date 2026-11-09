import { useState } from 'react';
import { audioSummary, KINDS } from '../model/derived';
import { minutes } from '../model/format';
import { deleteQuestion, updateDraft, updateQuestion, useDb } from '../model/store';
import type { AudioClip, Exercise, Question } from '../model/types';
import { back } from '../nav/nav';
import { AudioDrawer } from '../ui/audio';
import { ConfirmDrawer, InputDrawer, MenuDrawer } from '../ui/Drawer';
import { useDrawer } from '../ui/drawerContext';
import { Footer, type FooterButton } from '../ui/Footer';
import { Field } from '../ui/rows';
import { NotFound } from './NotFound';

const editorFooter = (readOnly: boolean, ok: () => void, extra: FooterButton[] = []): FooterButton[] =>
  readOnly ? [{ label: 'Back', onClick: back }] : [{ label: 'Cancel', onClick: back }, ...extra, { label: 'OK', onClick: ok }];

/* ---------- Material ---------- */

export function Material({ id }: { id: string }) {
  const e = useDb().exercises.find(x => x.id === id);
  if (!e) return <NotFound />;
  return <MaterialForm e={e} />;
}

/** Read and listen material. Video is edited on Exercise detail (URL and clip drawers). */
function MaterialForm({ e }: { e: Exercise }) {
  const drawer = useDrawer();
  const ro = e.status !== 'draft';
  // Form state starts from the saved material and is written back only on OK.
  const [text, setText] = useState(e.kind === 'read' ? e.material.text : '');
  const [audio, setAudio] = useState<AudioClip | undefined>(e.kind === 'listen' ? e.material.audio : undefined);
  const [sourceText, setSourceText] = useState(e.kind === 'listen' ? e.material.sourceText ?? '' : '');

  const ok = () => {
    updateDraft(e.id, x => {
      if (x.kind === 'read') x.material = { text };
      if (x.kind === 'listen') x.material = { ...(audio && { audio }), ...(sourceText.trim() && { sourceText }) };
    });
    back();
  };

  return (
    <>
      <p><small>{e.title} · {KINDS[e.kind].label}</small></p>
      {e.kind === 'read' && (
        <p><label>Text students read<br /><textarea rows={14} disabled={ro} value={text} onChange={ev => setText(ev.target.value)} /></label></p>
      )}
      {e.kind === 'listen' && <>
        <Field label="Recording" value={audioSummary(audio)} onClick={!ro || audio ? () => drawer.open(
          <AudioDrawer title="Exercise recording" value={audio} onChange={setAudio} canDelete={false} readOnly={ro} />) : undefined} />
        <p><label>Text of the recording (optional)<br /><textarea rows={6} disabled={ro} value={sourceText} onChange={ev => setSourceText(ev.target.value)} /></label></p>
        <p><small>Shown to you while reviewing. Later: generate the recording from this text.</small></p>
      </>}
      <Footer buttons={editorFooter(ro, ok)} />
    </>
  );
}

/* ---------- Question ---------- */

/** Target answer lengths, in minutes. */
const TARGETS = [1, 2, 3, 4, 5];

/** A question's detail page. Each row is set on its own and saved right away. */
export function QuestionEditor({ exerciseId, questionId }: { exerciseId: string; questionId: string }) {
  const drawer = useDrawer();
  const e = useDb().exercises.find(x => x.id === exerciseId);
  const q = e?.questions.find(x => x.id === questionId);
  if (!e || !q) return <NotFound />;
  const draft = e.status === 'draft';
  const edit = (fn: () => void) => (draft ? fn : undefined);
  const update = (fn: (q: Question) => void) => updateQuestion(exerciseId, questionId, fn);

  return (
    <>
      <Field label="Prompt text" value={q.promptText || 'Missing'} onClick={edit(() => drawer.open(
        <InputDrawer title="Prompt text" rows={4} initial={q.promptText ?? ''}
          onDone={v => update(x => { x.promptText = v; })} />))} />
      <Field label="Audio" value={audioSummary(q.promptAudio)}
        onClick={draft || q.promptAudio ? () => drawer.open(
          <AudioDrawer title={`Question ${e.questions.indexOf(q) + 1} audio`} value={q.promptAudio} readOnly={!draft}
            onChange={v => update(x => { x.promptAudio = v; })} />) : undefined} />
      <Field label="Target length" value={q.targetSeconds ? minutes(q.targetSeconds) : 'No limit'} onClick={edit(() => drawer.open(
        <MenuDrawer<number | undefined> title="Target answer length"
          note="A goal, not a cutoff. Students see when they go over."
          options={[...TARGETS.map(m => ({ label: `${m} min`, value: m * 60 })), { label: 'No limit', value: undefined }]}
          onPick={v => update(x => { x.targetSeconds = v; })} />))} />
      {draft && <Footer buttons={[{
        label: 'Delete question',
        onClick: () => drawer.open(<ConfirmDrawer title="Delete this question?" confirmLabel="Delete"
          onConfirm={() => { back(); deleteQuestion(exerciseId, questionId); }} />),
      }]} />}
    </>
  );
}
