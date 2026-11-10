import { KINDS } from '../model/derived';
import type { Exercise } from '../model/types';

/** A read-only summary of an exercise: what kind, its title, its first question. Tappable when onClick is set. */
export function ExerciseCard({ e, onClick }: { e: Exercise; onClick?: () => void }) {
  const first = e.questions[0]?.promptText;
  return (
    <div className="card" {...(onClick && { role: 'button', tabIndex: 0, onClick, onKeyDown: ev => { if (ev.key === 'Enter') onClick(); } })}>
      {onClick && <span className="chev">›</span>}
      <small>{KINDS[e.kind].kicker}</small>
      <br />
      <b>{e.title}</b>
      {first && <><br /><small className="clamp3">{first}</small></>}
    </div>
  );
}
