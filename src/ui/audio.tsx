import { useEffect, useRef, useState, type ReactNode } from 'react';
import { mmss } from '../model/format';
import { fakeAudio } from '../model/store';
import type { AudioClip } from '../model/types';
import { DrawerShell } from './Drawer';
import { useDrawer } from './drawerContext';

/** "1:16.3": minutes, seconds, tenths. */
const elapsed = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s * 10) % 10)}`;

/** Calls `tick(dt)` every 100 ms while `on`, with dt in seconds. */
function useTicker(on: boolean, tick: (dt: number) => void) {
  const ref = useRef(tick);
  useEffect(() => { ref.current = tick; });
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => ref.current(0.1), 100);
    return () => clearInterval(t);
  }, [on]);
}

type Mode = 'player' | 'ready' | 'recording' | 'confirmReplace' | 'confirmDelete';

/**
 * The audio drawer: record, then play back, record again, or delete. Audio is faked.
 * Each change calls `onChange` right away (on Stop, on Delete), so the closing button is Done.
 * The previous recording is kept until a new one is stopped, so cancelling a new take loses nothing.
 */
export function AudioDrawer({ title, value, onChange, canDelete = true, readOnly = false, children }: {
  title: string;
  /** Shown above the player, e.g. the question's text. */
  children?: ReactNode;
  value: AudioClip | undefined;
  onChange?: (clip: AudioClip | undefined) => void;
  /** False where a recording is required (e.g. Listen material). */
  canDelete?: boolean;
  readOnly?: boolean;
}) {
  const { close, setLocked } = useDrawer();
  const [clip, setClip] = useState(value);
  const [mode, setMode] = useState<Mode>(value || readOnly ? 'player' : 'ready');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => { setLocked(mode === 'recording'); }, [mode, setLocked]);
  useTicker(mode === 'recording', dt => setSeconds(s => s + dt));

  const set = (c: AudioClip | undefined) => { setClip(c); onChange?.(c); };
  const startRecording = () => { setSeconds(0); setMode('recording'); };
  const stop = () => { set(fakeAudio(Math.max(1, Math.round(seconds)))); setMode('player'); };
  const cancelTake = () => (clip ? setMode('player') : close());

  if (mode === 'ready' || mode === 'recording') {
    const recording = mode === 'recording';
    return (
      <DrawerShell title={title} actions={<button onClick={recording || clip ? cancelTake : close}>Cancel</button>}>
        <div className="recorder">
          {recording ? <p className="timer">{elapsed(seconds)}</p> : <p>Tap to record</p>}
          <button className="rec-btn" aria-label={recording ? 'Stop recording' : 'Start recording'}
            onClick={recording ? stop : startRecording}>
            <span className={recording ? 'rec-square' : 'rec-dot'} />
          </button>
          {recording && <p>Stop recording</p>}
        </div>
      </DrawerShell>
    );
  }

  if (mode === 'confirmReplace' || mode === 'confirmDelete') {
    const replace = mode === 'confirmReplace';
    return (
      <DrawerShell title={title} actions={<>
        <button onClick={() => setMode('player')}>Cancel</button>
        <button onClick={() => {
          if (replace) setMode('ready');
          else { set(undefined); setMode('ready'); }
        }}>{replace ? 'Replace' : 'Delete'}</button>
      </>}>
        <p>{replace ? 'Replace this recording? The new one takes its place when you stop recording.' : 'Delete this recording?'}</p>
      </DrawerShell>
    );
  }

  return (
    <DrawerShell title={title} actions={!readOnly && <>
      {clip && canDelete && <button onClick={() => setMode('confirmDelete')}>Delete</button>}
      {clip && <button onClick={() => setMode('confirmReplace')}>Record again</button>}
      <button onClick={close}>Done</button>
    </>}>
      {children}
      {clip ? <Player key={clip.path} clip={clip} /> : <p>No recording.</p>}
    </DrawerShell>
  );
}

// Media symbols; U+FE0E asks for the plain text glyph, not the color emoji (iOS).
const PLAY = '\u25B6\uFE0E';
const PAUSE = '\u23F8\uFE0E';
const BACK = '\u23EA\uFE0E';
const FORWARD = '\u23E9\uFE0E';

/** Fake playback: a slider, "0:02 / 2:42", and back 15 s / play-pause / skip 15 s. */
function Player({ clip }: { clip: AudioClip }) {
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const d = clip.duration;
  // At the end, stop and go back to the start.
  useTicker(playing, dt => {
    if (pos + dt < d) setPos(pos + dt);
    else { setPlaying(false); setPos(0); }
  });
  const seek = (p: number) => setPos(Math.min(d, Math.max(0, p)));
  return (
    <>
      <input className="scrub" type="range" min={0} max={d} step={0.1} value={pos}
        aria-label="Position" onChange={e => seek(Number(e.target.value))} />
      <p className="audio-time">{mmss(pos)} / {mmss(d)}</p>
      <div className="audio-row media">
        <button aria-label="Back 15 seconds" onClick={() => seek(pos - 15)}>{BACK} 15</button>
        <button aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(p => !p)}>{playing ? PAUSE : PLAY}</button>
        <button aria-label="Skip 15 seconds" onClick={() => seek(pos + 15)}>15 {FORWARD}</button>
      </div>
    </>
  );
}

/** A Play button that opens the player for a recording someone else made (read-only). */
export function PlayButton({ title, clip }: { title: string; clip: AudioClip }) {
  const drawer = useDrawer();
  return <button type="button" onClick={() => drawer.open(<AudioDrawer title={title} value={clip} readOnly />)}>Play</button>;
}
