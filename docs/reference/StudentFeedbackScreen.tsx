// StudentFeedbackScreen.tsx — clickable prototype of the student's feedback-listening screen.
// Audio is SIMULATED (timers only). See audio-feedback-spec.md for the behavior rules.
// Self-contained: React only, inline styles, no other dependencies.

import React, { useEffect, useRef, useState, type CSSProperties } from 'react';

// ---------- data & helpers ----------
const DUR = 48;
const BARS = 56;
const CTX = 5;
const TICK = 0.1;

const HEIGHTS: number[] = Array.from({ length: BARS }, (_, i) => {
  const v = Math.abs(Math.sin(i * 1.7) * Math.sin(i * 0.37 + 1));
  const quiet = (i > 17 && i < 21) || (i > 38 && i < 41);
  return quiet ? 4 : 8 + Math.round(v * 40);
});

// A comment has audio (len > 0), text, or both.
type Comment = { id: number; num?: number; at: number; len: number; text?: string; overall?: boolean };
const COMMENTS: Comment[] = [
  { id: 1, num: 1, at: 6.2, len: 4.1 },
  { id: 2, num: 2, at: 13.5, len: 7.3, text: 'through — not “thru”' },
  { id: 3, num: 3, at: 22, len: 0, text: 'Good example from the video!' },
  { id: 4, num: 4, at: 39, len: 3.5 },
  { id: 5, overall: true, at: DUR, len: 9 },
];

const fmt = (s: number) => {
  const r = Math.max(0, Math.round(s));
  const sec = r % 60;
  return `${Math.floor(r / 60)}:${sec < 10 ? '0' : ''}${sec}`;
};
const same = (a: number, b: number) => Math.abs(a - b) < 0.05;

type State = {
  t: number;
  playing: boolean;
  stopAt: number | null; // replay end point (null = normal playback)
  ctxId: number | null; // comment whose "before" window is replaying
  ctxLen: number; // current replay window length
  lastEnd: number | null; // end point of the last finished replay
  activeId: number | null; // comment the student last tapped
  playingId: number | null;
  playT: number;
  heard: Record<number, true>;
  follow: boolean;
};

const initial: State = {
  t: 0, playing: false, stopAt: null, ctxId: null, ctxLen: CTX, lastEnd: null,
  activeId: null, playingId: null, playT: 0, heard: {}, follow: true,
};

function tick(s: State): State {
  let n = s;
  const patch = (p: Partial<State>) => (n = { ...n, ...p });
  if (s.playing) {
    let t = s.t + TICK;
    if (s.stopAt != null && t >= s.stopAt) {
      patch({ t: s.stopAt, playing: false, lastEnd: s.stopAt, stopAt: null, ctxId: null });
    } else {
      if (t >= DUR) { t = DUR; patch({ playing: false }); }
      patch({ t });
    }
  }
  if (s.playingId != null) {
    const c = COMMENTS.find((x) => x.id === s.playingId)!;
    const p = s.playT + TICK;
    if (p >= c.len) patch({ heard: { ...s.heard, [c.id]: true }, playingId: null, playT: 0 });
    else patch({ playT: p });
  }
  return n;
}

// ---------- icons ----------
const Svg = ({ size = 18, children, fill }: { size?: number; children: React.ReactNode; fill?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={fill ? 'currentColor' : 'none'}
    stroke={fill ? 'none' : 'currentColor'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const PlayIcon = ({ size }: { size?: number }) => <Svg size={size} fill><path d="M8 5v14l11-7z" /></Svg>;
const PauseIcon = ({ size }: { size?: number }) => (
  <Svg size={size} fill><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></Svg>
);
const BackIcon = () => <Svg size={22}><path d="M15 18l-6-6 6-6" /></Svg>;
const RewindIcon = () => <Svg><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Svg>;
const ForwardIcon = () => <Svg><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></Svg>;
const CheckIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Heard">
    <path d="M5 12l5 5L20 7" />
  </svg>
);
const Ring = ({ pct }: { pct: number }) => (
  <svg width={44} height={44} viewBox="0 0 44 44" aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, transform: 'rotate(-90deg)' }}>
    <circle cx={22} cy={22} r={20} fill="none" stroke="#1D4ED8" strokeWidth={3} strokeLinecap="round"
      strokeDasharray={125.66} strokeDashoffset={125.66 * (1 - pct)} />
  </svg>
);

// ---------- styles ----------
const C = { ink: '#13202B', sub: '#5B6875', body: '#3B4754', blue: '#1D4ED8', line: '#E3E8EE', red: '#DC2626', ground: '#F3F5F7' };
const roundBtn = (size: number, bg: string, color = C.ink): CSSProperties => ({
  width: size, height: size, borderRadius: size / 2, border: 'none', background: bg, color,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer',
});

// ---------- component ----------
export default function StudentFeedbackScreen() {
  const [s, setS] = useState<State>(initial);
  const update = (fn: (prev: State) => State) => setS(fn);

  useEffect(() => {
    const id = setInterval(() => setS(tick), TICK * 1000);
    return () => clearInterval(id);
  }, []);

  const active = s.playing || s.playingId != null || s.t > 0;
  const actC = s.activeId != null ? COMMENTS.find((c) => c.id === s.activeId && !c.overall) : undefined;
  const ctxC = s.ctxId != null ? COMMENTS.find((c) => c.id === s.ctxId) : undefined;
  const atPoint = !!actC && !s.playing && same(s.t, actC.at);
  const again = !s.playing && s.lastEnd != null && same(s.lastEnd, s.t);
  const winEnd = s.stopAt != null ? s.stopAt : again ? s.lastEnd : atPoint ? actC!.at : null;
  const winLen = s.stopAt != null || again ? s.ctxLen : CTX;
  const winStart = winEnd != null ? Math.max(0, winEnd - winLen) : 0;

  const nearId = (() => {
    if (s.playingId != null) return s.playingId;
    if (s.ctxId != null) return s.ctxId;
    if (s.activeId != null && !s.playing) return s.activeId;
    if (s.t >= DUR - 0.05) return 5;
    let best: number | null = null;
    COMMENTS.forEach((c) => { if (!c.overall && c.at <= s.t + 0.05) best = c.id; });
    return best;
  })();

  // ---- follow-scroll ----
  const listRef = useRef<HTMLDivElement>(null);
  const targetKey = `c${nearId ?? 1}`;
  useEffect(() => {
    const box = listRef.current;
    if (!box || !s.follow) return;
    const el = box.querySelector<HTMLElement>(`[data-row="${targetKey}"]`);
    if (el) box.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: 'smooth' });
  }, [targetKey, s.follow]);

  // ---- actions ----
  const clearReplay = { stopAt: null, ctxId: null } as const;
  const togglePlay = () => update((p) =>
    !p.playing && p.t >= DUR
      ? { ...p, ...clearReplay, t: 0, playing: true, playingId: null, follow: true }
      : { ...p, ...clearReplay, playing: !p.playing, playingId: null, follow: true });

  const back5 = () => update((p) => {
    if (p.stopAt != null) {
      const len = Math.min(p.stopAt, p.ctxLen + 5);
      return { ...p, t: p.stopAt - len, ctxLen: len, playing: true, follow: true };
    }
    if (p.playing) return { ...p, t: Math.max(0, p.t - 5), follow: true };
    if (p.t <= 0.05) return p;
    const rep = p.lastEnd != null && same(p.lastEnd, p.t);
    const len = Math.min(p.t, rep ? p.ctxLen : CTX);
    const onC = p.activeId != null && COMMENTS.some((c) => c.id === p.activeId && !c.overall && same(c.at, p.t));
    return { ...p, stopAt: p.t, ctxLen: len, t: p.t - len, playing: true, ctxId: onC ? p.activeId : null, playingId: null, playT: 0, follow: true };
  });
  const fwd5 = () => update((p) => ({ ...p, ...clearReplay, t: Math.min(DUR, p.t + 5), follow: true }));
  const scrub = (v: number) => update((p) => ({ ...p, ...clearReplay, t: v, activeId: null, follow: true }));

  const playComment = (c: Comment) => update((p) => {
    if (p.playingId === c.id) return { ...p, playingId: null, playT: 0 };
    if (!(c.len > 0)) {
      // text-only: move the playhead there and count it as heard
      return {
        ...p, ...clearReplay, heard: { ...p.heard, [c.id]: true }, playingId: null, playT: 0, playing: false,
        follow: true, activeId: c.id, t: c.at, ctxLen: p.activeId !== c.id ? CTX : p.ctxLen,
      };
    }
    return {
      ...p, ...clearReplay, playingId: c.id, playT: 0, playing: false, follow: true, activeId: c.id, t: c.at,
      ctxLen: p.activeId !== c.id ? CTX : p.ctxLen,
    };
  });

  // ---- labels ----
  let label = 'Your answer';
  let labelColor = C.ink;
  if (ctxC) { label = `What you said before Comment ${ctxC.num}`; labelColor = C.blue; }
  else if (s.stopAt != null) { label = 'Replaying'; labelColor = C.blue; }
  else if (atPoint) { label = `Tap ↺ to hear what you said before Comment ${actC!.num}`; labelColor = C.blue; }

  const heardCount = COMMENTS.filter((c) => s.heard[c.id]).length;
  const replaying = s.stopAt != null;

  // ---------- render ----------
  return (
    <div style={{ width: 390, height: 844, boxSizing: 'border-box', background: C.ground, fontFamily: 'Inter, system-ui, sans-serif', color: C.ink, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px 8px' }}>
        <button aria-label="Back to my tasks" style={{ width: 44, height: 44, border: 'none', background: 'transparent', color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BackIcon /></button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Feedback from your teacher</div>
          <div style={{ fontSize: 12, color: C.sub }}>Video task · Question 2</div>
        </div>
      </div>
      <p style={{ margin: '0 18px 10px', fontSize: 13, lineHeight: 1.4, color: C.body }}>
        “If you could ask the main character one question, what would it be, and why?”
      </p>

      {/* player */}
      <div style={{ margin: '0 12px', background: '#fff', borderRadius: 12, padding: '12px 14px 8px', boxShadow: '0 1px 2px rgba(19,32,43,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: C.sub }}>
          <span style={{ fontWeight: 600, color: labelColor }}>{label}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{fmt(s.t)} / {fmt(DUR)}</span>
        </div>
        <div aria-hidden="true" style={{ position: 'relative', height: 14, marginTop: 8 }}>
          {COMMENTS.filter((c) => !c.overall).map((c) => (
            <span key={c.id} style={{ position: 'absolute', left: `${(c.at / DUR) * 100}%`, top: 1, transform: 'translateX(-50%)', width: 10, height: 10, boxSizing: 'border-box', borderRadius: 5, border: `2px solid ${C.blue}`, background: s.heard[c.id] ? C.blue : '#fff' }} />
          ))}
        </div>
        <div style={{ position: 'relative', height: 56 }}>
          {winEnd != null && (
            <div aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: `${(winStart / DUR) * 100}%`, width: `${((winEnd - winStart) / DUR) * 100}%`, background: '#DCE7FD', borderRadius: 6 }} />
          )}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            {HEIGHTS.map((h, i) => (
              <div key={i} style={{ flex: 1, height: h, borderRadius: 2, background: ((i + 0.5) / BARS) * DUR <= s.t ? C.ink : '#C5CDD6' }} />
            ))}
          </div>
          {COMMENTS.filter((c) => !c.overall).map((c) => (
            <div key={c.id} aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: `${(c.at / DUR) * 100}%`, width: 2, background: C.blue, opacity: 0.55 }} />
          ))}
          <div aria-hidden="true" style={{ position: 'absolute', top: -4, bottom: -4, left: `${(s.t / DUR) * 100}%`, width: 2, background: C.red }} />
          <input type="range" min={0} max={DUR * 10} value={Math.round(s.t * 10)} onChange={(e) => scrub(Number(e.target.value) / 10)}
            aria-label="Seek in your answer" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', margin: 0, opacity: 0, cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, paddingTop: 8 }}>
          <button onClick={back5} aria-label={replaying ? 'Go back 5 more seconds' : s.playing ? 'Back 5 seconds' : 'Replay the last 5 seconds'}
            style={roundBtn(48, replaying ? '#DCE7FD' : atPoint ? '#E8EFFD' : '#EEF1F4')}>
            <RewindIcon /><span style={{ fontSize: 10, fontWeight: 600 }}>{replaying ? '+5s' : '5s'}</span>
          </button>
          <button onClick={togglePlay} aria-label={s.playing ? 'Pause your answer' : 'Play your answer'} style={roundBtn(60, C.ink, '#fff')}>
            {s.playing ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
          </button>
          <button onClick={fwd5} aria-label="Forward 5 seconds" style={roundBtn(48, '#EEF1F4')}>
            <ForwardIcon /><span style={{ fontSize: 10, fontWeight: 600 }}>5s</span>
          </button>
        </div>
      </div>

      {/* list header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: C.sub, padding: '14px 16px 6px', height: 46, boxSizing: 'border-box' }}>
        <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Teacher’s comments</span>
        {s.follow ? (
          <span style={{ fontSize: 12 }}>{heardCount} of {COMMENTS.length} heard</span>
        ) : (
          <button onClick={() => update((p) => ({ ...p, follow: true }))} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: `1px solid ${C.blue}`, background: '#fff', color: C.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Follow playback</button>
        )}
      </div>

      {/* list */}
      <div ref={listRef} onWheel={() => s.follow && update((p) => ({ ...p, follow: false }))} onTouchMove={() => s.follow && update((p) => ({ ...p, follow: false }))}
        style={{ flex: 1, overflowY: 'auto', padding: '2px 12px 16px', position: 'relative' }}>
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
          {COMMENTS.map((c, idx) => {
            const playing = s.playingId === c.id;
            const ctxOn = s.ctxId === c.id;
            const isActive = s.activeId === c.id;
            const hl = playing || ctxOn || isActive || (active && nearId === c.id);
            const title = c.overall ? 'Overall comment' : `Comment ${c.num}`;
            const bg = isActive || playing || ctxOn ? '#DCE7FD' : hl ? '#EEF4FF' : '#fff';
            return (
              <div key={c.id} data-row={`c${c.id}`} style={{ background: bg, borderBottom: idx < COMMENTS.length - 1 ? `1px solid ${C.line}` : 'none', padding: '6px 10px 6px 8px', transition: 'background .4s', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => playComment(c)} aria-label={c.len > 0 ? `${playing ? 'Pause' : 'Play'} ${title}` : `Go to ${title}`}
                  style={{ ...roundBtn(44, '#E8EFFD', C.blue), position: 'relative', flex: 'none' }}>
                  {playing && <Ring pct={Math.min(1, s.playT / c.len)} />}
                  {playing ? <PauseIcon /> : c.len > 0 ? <PlayIcon /> : <span style={{ fontSize: 15, fontWeight: 700 }}>Aa</span>}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
                    {s.heard[c.id] && <CheckIcon />}
                    <span style={{ flex: 1 }} />
                    {!c.overall && <span style={{ fontSize: 12, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>at {fmt(c.at)}</span>}
                  </div>
                  {c.text && <div style={{ fontSize: 14, lineHeight: 1.4, color: C.ink, marginTop: 3 }}>{c.text}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
