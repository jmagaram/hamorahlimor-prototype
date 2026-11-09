import { useState } from 'react';
import { fakeAudio } from '../model/store';
import type { AudioRef } from '../model/types';

/** Fake playback: the button only toggles. */
export function PlayButton() {
  const [playing, setPlaying] = useState(false);
  return <button type="button" onClick={() => setPlaying(p => !p)}>{playing ? '❚❚ Pause' : '▶ Play'}</button>;
}

/** Fake recorder: Record / Play / Re-record / Remove. */
export function AudioField({ value, onChange, readOnly }: {
  value: AudioRef | undefined; onChange?: (v: AudioRef | undefined) => void; readOnly?: boolean;
}) {
  if (value) {
    return (
      <>
        <PlayButton />
        {!readOnly && <>
          {' '}<button type="button" onClick={() => onChange?.(fakeAudio())}>Re-record</button>
          {' '}<button type="button" onClick={() => onChange?.(undefined)}>Remove</button>
        </>}
      </>
    );
  }
  return readOnly ? <small>None</small> : <button type="button" onClick={() => onChange?.(fakeAudio())}>● Record</button>;
}
