import { useState } from 'react';
import { audioSummary, hasQuestionAudio, isEmptyQuestion } from '../model/derived';
import { minutes } from '../model/format';
import { deleteQuestion, updateDraft, updateQuestion, useDb } from '../model/store';
import type { Exercise, Question } from '../model/types';
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

/** The text students read (Read and respond). Long, so it gets a full page. Listen and video are edited on Exercise detail. */
function MaterialForm({ e }: { e: Exercise }) {
  const ro = e.status !== 'draft';
  // Form state starts from the saved text and is written back only on OK.
  const [text, setText] = useState(e.kind === 'read' ? e.material.text : '');
  const ok = () => {
    updateDraft(e.id, x => { if (x.kind === 'read') x.material = { text }; });
    back();
  };
  return (
    <>
      <textarea rows={16} disabled={ro} value={text} autoFocus={!ro} aria-label="Text students read"
        onChange={ev => setText(ev.target.value)} />
      <Footer buttons={editorFooter(ro, ok)} />
    </>
  );
}

/* ---------- Question ---------- */

/** Target answer lengths, in minutes. */
/** Seconds. The teacher's longest answers are about 2 minutes. */
const TARGETS = [30, 60, 90, 120, 180, 240];

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
      <Field label="Question text" value={q.promptText || 'Missing'} onClick={edit(() => drawer.open(
        <InputDrawer title="Question text" rows={4} initial={q.promptText ?? ''}
          note={e.questionMode === 'hear'
            ? 'Required. Students only hear the audio, but you see this when grading.'
            : 'Required. Students read it, and you see it when grading.'}
          onDone={v => update(x => { x.promptText = v; })} />))} />
      {/* Audio only when students hear the questions; then it's required. */}
      {hasQuestionAudio(e) && <Field label="Audio" value={audioSummary(q.promptAudio, 'Not recorded yet (required)')}
        onClick={draft || q.promptAudio ? () => drawer.open(
          <AudioDrawer title={`Question ${e.questions.indexOf(q) + 1} audio`} value={q.promptAudio} readOnly={!draft}
            onChange={v => update(x => { x.promptAudio = v; })} />) : undefined} />}
      <Field label="Target length" value={q.targetSeconds ? minutes(q.targetSeconds) : 'No limit'} onClick={edit(() => drawer.open(
        <MenuDrawer<number | undefined> title="Target answer length"
          note="A goal, not a cutoff. Students see when they go over."
          options={[...TARGETS.map(t => ({ label: minutes(t), value: t })), { label: 'No limit', value: undefined }]}
          onPick={v => update(x => { x.targetSeconds = v; })} />))} />
      {draft && <Footer buttons={[{
        label: 'Delete question',
        // An empty question goes without asking.
        onClick: () => isEmptyQuestion(q) ? (back(), deleteQuestion(exerciseId, questionId)) : drawer.open(
          <ConfirmDrawer title="Delete this question?" confirmLabel="Delete"
            onConfirm={() => { back(); deleteQuestion(exerciseId, questionId); }} />),
      }]} />}
    </>
  );
}
