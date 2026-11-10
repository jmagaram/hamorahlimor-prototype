// TeacherFeedbackScreen.tsx — clickable prototype of the teacher feedback screen.
// A comment is anchored to a moment in the student's answer and has audio, text, or both.
// Audio is SIMULATED (timers only). See audio-feedback-spec.md for the behavior rules.
// Self-contained: React only, inline styles, no other dependencies.

import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

// ---------- data & helpers ----------
const DUR = 48; // student answer length (s) in the mock
const BARS = 56;
const CTX = 5; // default replay window (s)
const TICK = 0.1;

const HEIGHTS: number[] = Array.from({ length: BARS }, (_, i) => {
  const v = Math.abs(Math.sin(i * 1.7) * Math.sin(i * 0.37 + 1));
  const quiet = (i > 17 && i < 21) || (i > 38 && i < 41);
  return quiet ? 4 : 8 + Math.round(v * 40);
});

const fmt = (s: number) => {
  const r = Math.max(0, Math.round(s));
  const sec = r % 60;
  return `${Math.floor(r / 60)}:${sec < 10 ? '0' : ''}${sec}`;
};
const same = (a: number, b: number) => Math.abs(a - b) < 0.05;

type Comment = { id: number; at: number; len: number /* audio length, 0 = no audio */; text?: string; overall?: boolean };
type TextDraft = { id: number | null; at: number; overall: boolean };
type Rec = { at: number; len: number; overall: boolean; replaceId: number | null };
type Replay = { end: number; len: number };

type State = {
  t: number;
  playing: boolean;
  rec: Rec | null;
  comments: Comment[];
  nextId: number;
  playingId: number | null;
  playT: number;
  auto: boolean;
  screen: 'edit' | 'summary';
  follow: boolean;
  justSaved: number | null;
  savedTicks: number;
  replay: Replay | null;
  lastReplay: Replay | null;
  drawer: boolean;
  tdraw: TextDraft | null; // text drawer open for a new (id null) or existing comment
  draft: string;
};

const initial: State = {
  t: 15,
  playing: false,
  rec: null,
  comments: [
    { id: 1, at: 6.2, len: 4.1 },
    { id: 2, at: 13.5, len: 7.3, text: 'through — not “thru”' },
    { id: 3, at: 22, len: 0, text: 'Good example from the video!' },
  ],
  nextId: 4,
  playingId: null,
  playT: 0,
  auto: true,
  screen: 'edit',
  follow: true,
  justSaved: null,
  savedTicks: 0,
  replay: null,
  lastReplay: null,
  drawer: false,
  tdraw: null,
  draft: '',
};

const ordered = (s: State) => s.comments.filter((c) => !c.overall).sort((a, b) => a.at - b.at);

function tick(s: State): State {
  let n = s;
  const patch = (p: Partial<State>) => (n = { ...n, ...p });
  if (s.justSaved != null) {
    if (s.savedTicks >= 25) patch({ justSaved: null, savedTicks: 0 });
    else patch({ savedTicks: s.savedTicks + 1 });
  }
  if (s.rec) {
    patch({ rec: { ...s.rec, len: s.rec.len + TICK } });
  } else if (s.playing) {
    let t = s.t + TICK;
    if (s.replay && t >= s.replay.end) {
      patch({ t: s.replay.end, playing: false, lastReplay: s.replay, replay: null });
    } else {
      if (t >= DUR) {
        t = DUR;
        patch({ playing: false });
      }
      patch({ t });
    }
  }
  if (s.playingId != null) {
    const c = s.comments.find((x) => x.id === s.playingId);
    const p = s.playT + TICK;
    if (!c || p >= c.len) patch({ playingId: null, playT: 0 });
    else patch({ playT: p });
  }
  return n;
}

function startReplay(s: State, end: number, len: number): State {
  const l = Math.min(end, len);
  if (l <= 0.05) return s;
  return { ...s, replay: { end, len: l }, t: end - l, playing: true, playingId: null, follow: true };
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
const MicIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v4" /></Svg>
);
const StopIcon = ({ size }: { size?: number }) => <Svg size={size} fill><rect x="6" y="6" width="12" height="12" rx="2" /></Svg>;
const TrashIcon = () => <Svg><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /></Svg>;
const PencilIcon = () => <Svg><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>;
const BackIcon = () => <Svg size={22}><path d="M15 18l-6-6 6-6" /></Svg>;
const RewindIcon = () => <Svg><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Svg>;
const ForwardIcon = () => <Svg><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></Svg>;
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
const iconBtn: CSSProperties = { width: 40, height: 44, border: 'none', background: 'transparent', color: C.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

// ---------- component ----------
export default function TeacherFeedbackScreen({ studentName = 'Noa' }: { studentName?: string }) {
  const [s, setS] = useState<State>(initial);
  const update = (fn: (prev: State) => State) => setS(fn);

  useEffect(() => {
    const id = setInterval(() => setS(tick), TICK * 1000);
    return () => clearInterval(id);
  }, []);

  const ord = useMemo(() => ordered(s), [s.comments]); // eslint-disable-line react-hooks/exhaustive-deps
  const numOf = useMemo(() => Object.fromEntries(ord.map((c, i) => [c.id, i + 1])), [ord]);
  const overall = s.comments.find((c) => c.overall);
  const isRec = !!s.rec;
  const base = s.replay ? s.replay.end : s.t;
  const win = s.replay ?? (!s.playing && !isRec && s.lastReplay && same(s.lastReplay.end, s.t) ? s.lastReplay : null);

  const nearId = (() => {
    let best: number | null = null;
    ord.forEach((c) => { if (c.at <= s.t + 0.05) best = c.id; });
    if (best == null && s.t >= DUR - 0.05 && overall) best = overall.id;
    return best;
  })();

  // ---- follow-scroll ----
  const listRef = useRef<HTMLDivElement>(null);
  const targetKey = (() => {
    if (s.rec) return s.rec.replaceId != null ? `c${s.rec.replaceId}` : 'rec';
    if (s.justSaved != null) return `c${s.justSaved}`;
    if (s.t >= DUR - 0.05 && overall) return `c${overall.id}`;
    if (nearId != null) return `c${nearId}`;
    return ord[0] ? `c${ord[0].id}` : null;
  })();
  useEffect(() => {
    const box = listRef.current;
    if (!box || !s.follow || !targetKey || s.screen !== 'edit') return;
    const el = box.querySelector<HTMLElement>(`[data-row="${targetKey}"]`);
    if (el) box.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: 'smooth' });
  }, [targetKey, s.follow, s.screen]);

  // ---- actions ----
  const togglePlay = () => update((p) => {
    if (p.rec) return p;
    if (!p.playing && p.t >= DUR) return { ...p, t: 0, playing: true, playingId: null, follow: true, replay: null };
    return { ...p, playing: !p.playing, playingId: null, follow: true, replay: null };
  });
  const back5 = () => update((p) => {
    if (p.rec) return p;
    if (p.replay) return startReplay(p, p.replay.end, p.replay.len + 5);
    if (p.playing) return { ...p, t: Math.max(0, p.t - 5), follow: true };
    const lr = p.lastReplay;
    return startReplay(p, p.t, lr && same(lr.end, p.t) ? lr.len : CTX);
  });
  const fwd5 = () => update((p) => (p.rec ? p : { ...p, t: Math.min(DUR, p.t + 5), follow: true, replay: null }));
  const scrub = (v: number) => update((p) => (p.rec ? p : { ...p, t: v, follow: true, replay: null }));

  const onComment = () => update((p) => {
    if (p.rec) {
      const r = p.rec;
      const len = Math.max(1, r.len);
      const comments = r.replaceId != null
        ? p.comments.map((c) => (c.id === r.replaceId ? { ...c, len } : c))
        : [...p.comments, { id: p.nextId, at: r.at, len, overall: r.overall }];
      return {
        ...p, rec: null, comments, nextId: p.nextId + 1,
        playing: r.replaceId == null && !r.overall && p.auto && p.t < DUR,
        justSaved: r.replaceId ?? p.nextId, savedTicks: 0, follow: true,
      };
    }
    const anchor = p.replay ? p.replay.end : p.t;
    const atEnd = anchor >= DUR - 0.05;
    const existing = atEnd ? p.comments.find((c) => c.overall) : undefined;
    return {
      ...p, t: anchor, replay: null, playing: false, playingId: null, follow: true, justSaved: null,
      rec: { at: anchor, len: 0, overall: atEnd, replaceId: existing ? existing.id : null },
    };
  });

  const playComment = (c: Comment) => update((p) => {
    if (p.rec) return p;
    if (!(c.len > 0)) return { ...p, playingId: null, playing: false, replay: null, t: c.at, follow: true }; // text-only: just move playhead
    if (p.playingId === c.id) return { ...p, playingId: null, playT: 0 };
    return { ...p, playingId: c.id, playT: 0, playing: false, replay: null, t: c.at, follow: true };
  });
  const redo = (c: Comment) => update((p) => (p.rec ? p : {
    ...p, rec: { at: c.at, len: 0, replaceId: c.id, overall: !!c.overall }, playing: false, playingId: null, justSaved: null,
  }));
  const del = (c: Comment) => update((p) => (p.rec ? p : { ...p, comments: p.comments.filter((x) => x.id !== c.id), playingId: null }));

  // ---- text comments ----
  const openNewText = () => update((p) => {
    if (p.rec) return p;
    const anchor = p.replay ? p.replay.end : p.t;
    const atEnd = anchor >= DUR - 0.05;
    const ex = atEnd ? p.comments.find((c) => c.overall) : undefined;
    return {
      ...p, t: anchor, replay: null, playing: false, playingId: null,
      tdraw: ex ? { id: ex.id, at: ex.at, overall: true } : { id: null, at: anchor, overall: atEnd },
      draft: ex?.text ?? '',
    };
  });
  const editText = (c: Comment) => update((p) => (p.rec ? p : {
    ...p, tdraw: { id: c.id, at: c.at, overall: !!c.overall }, draft: c.text ?? '', playing: false, playingId: null, replay: null,
  }));
  const saveText = () => update((p) => {
    const d = p.tdraw; const txt = p.draft.trim();
    if (!d) return p;
    if (d.id != null) {
      const comments = p.comments
        .map((c) => (c.id === d.id ? { ...c, text: txt || undefined } : c))
        .filter((c) => c.len > 0 || c.text); // a comment with neither audio nor text disappears
      return { ...p, tdraw: null, draft: '', comments, justSaved: d.id, savedTicks: 0, follow: true };
    }
    if (!txt) return p;
    return {
      ...p, tdraw: null, draft: '', comments: [...p.comments, { id: p.nextId, at: d.at, len: 0, text: txt, overall: d.overall }],
      nextId: p.nextId + 1, justSaved: p.nextId, savedTicks: 0, follow: true,
      playing: !d.overall && p.auto && p.t < DUR,
    };
  });
  const editing = s.tdraw?.id != null ? s.comments.find((c) => c.id === s.tdraw!.id) : undefined;
  const canSave = !!s.tdraw && (!!s.draft.trim() || (!!editing && editing.len > 0 && !!editing.text));

  const goDone = () => update((p) => {
    if (p.rec) return p;
    const q = { ...p, playing: false, playingId: null, replay: null };
    return p.comments.some((c) => c.overall) ? { ...q, screen: 'summary' } : { ...q, drawer: true };
  });

  // ---- big button label ----
  let cbTitle: string, cbSub: string;
  if (s.rec) {
    cbTitle = 'Stop & save';
    cbSub = `Recording ${fmt(s.rec.len)}${s.rec.overall ? ' · overall comment' : ` · ${studentName} paused at ${fmt(s.rec.at)}`}`;
  } else if (base >= DUR - 0.05) {
    cbTitle = 'Record overall comment'; cbSub = 'Sums up the whole answer';
  } else if (s.playing && !s.replay) {
    cbTitle = 'Pause & comment'; cbSub = `${studentName} pauses at ${fmt(s.t)}`;
  } else {
    const here = ord.filter((c) => Math.abs(c.at - base) < 0.5);
    if (here.length) {
      cbTitle = 'Another comment here';
      cbSub = `Adds to comment ${numOf[here[here.length - 1].id]} at ${fmt(base)}`;
    } else {
      cbTitle = 'Comment'; cbSub = `At ${fmt(base)}, where you paused`;
    }
  }

  // ---- list rows (timeline order, pending recording in place) ----
  type Row = { pending: true; key: string; k: number; o: number } | { pending: false; key: string; k: number; o: number; c: Comment };
  const rows: Row[] = [
    ...s.comments.map((c): Row => ({ pending: false, key: `c${c.id}`, k: c.overall ? 1e9 : c.at, o: 0, c })),
    ...(s.rec && s.rec.replaceId == null ? [{ pending: true as const, key: 'rec', k: s.rec.overall ? 1e9 : s.rec.at, o: 1 }] : []),
  ].sort((a, b) => a.k - b.k || a.o - b.o);

  const dim = isRec ? 0.35 : 1;

  // ---------- render ----------
  return (
    <div style={{ width: 390, height: 844, boxSizing: 'border-box', background: C.ground, fontFamily: 'Inter, system-ui, sans-serif', color: C.ink, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 44, position: 'relative' }}>
      {s.screen === 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 800 }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 8px' }}>
            <button onClick={goDone} disabled={isRec} aria-label={`Back to ${studentName}’s feedback`} style={{ ...iconBtn, width: 44, color: C.ink, opacity: dim }}><BackIcon /></button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{studentName} L.</div>
              <div style={{ fontSize: 12, color: C.sub }}>Video task · Question 2</div>
            </div>
            <div style={{ width: 44 }} />
          </div>
          <p style={{ margin: '0 18px 10px', fontSize: 13, lineHeight: 1.4, color: C.body }}>
            “If you could ask the main character one question, what would it be, and why?”
          </p>

          {/* player */}
          <div style={{ margin: '0 12px', background: '#fff', borderRadius: 12, padding: '12px 14px 8px', boxShadow: '0 1px 2px rgba(19,32,43,0.08)', opacity: dim, transition: 'opacity .2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.sub }}>
              <span style={{ fontWeight: 600, color: C.ink }}>Student answer</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(s.t)} / {fmt(DUR)}</span>
            </div>
            <div aria-hidden="true" style={{ position: 'relative', height: 12, marginTop: 8 }}>
              {ord.map((c) => (
                <span key={c.id} style={{ position: 'absolute', left: `${(c.at / DUR) * 100}%`, top: 2, transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: 4, background: C.blue }} />
              ))}
            </div>
            <div style={{ position: 'relative', height: 56 }}>
              {win && (
                <>
                  <div aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: `${((win.end - win.len) / DUR) * 100}%`, width: `${(win.len / DUR) * 100}%`, background: '#DCE7FD', borderRadius: 6 }} />
                  <div aria-hidden="true" style={{ position: 'absolute', top: -6, bottom: -6, left: `${(win.end / DUR) * 100}%`, width: 3, marginLeft: -1, borderRadius: 2, background: C.blue }} />
                </>
              )}
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                {HEIGHTS.map((h, i) => (
                  <div key={i} style={{ flex: 1, height: h, borderRadius: 2, background: ((i + 0.5) / BARS) * DUR <= s.t ? C.ink : '#C5CDD6' }} />
                ))}
              </div>
              {ord.map((c) => (
                <div key={c.id} aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: `${(c.at / DUR) * 100}%`, width: 2, background: C.blue, opacity: 0.55 }} />
              ))}
              <div aria-hidden="true" style={{ position: 'absolute', top: -4, bottom: -4, left: `${(s.t / DUR) * 100}%`, width: 2, background: C.red }} />
              <input type="range" min={0} max={DUR * 10} value={Math.round(s.t * 10)} disabled={isRec}
                onChange={(e) => scrub(Number(e.target.value) / 10)} aria-label="Seek in student recording"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', margin: 0, opacity: 0, cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, paddingTop: 8 }}>
              <button onClick={back5} disabled={isRec}
                aria-label={s.replay ? 'Go back 5 more seconds' : s.playing ? 'Back 5 seconds' : 'Replay the last 5 seconds'}
                style={roundBtn(48, s.replay ? '#DCE7FD' : '#EEF1F4')}>
                <RewindIcon /><span style={{ fontSize: 10, fontWeight: 600 }}>{s.replay ? '+5s' : '5s'}</span>
              </button>
              <button onClick={togglePlay} disabled={isRec} aria-label={s.playing ? `Pause ${studentName}’s answer` : `Play ${studentName}’s answer`} style={roundBtn(60, C.ink, '#fff')}>
                {s.playing ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
              </button>
              <button onClick={fwd5} disabled={isRec} aria-label="Forward 5 seconds" style={roundBtn(48, '#EEF1F4')}>
                <ForwardIcon /><span style={{ fontSize: 10, fontWeight: 600 }}>5s</span>
              </button>
            </div>
          </div>

          {/* big comment button */}
          <div style={{ padding: '12px 12px 4px' }}>
            <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onComment} style={{ flex: 1, minWidth: 0, height: 68, borderRadius: 8, border: 'none', background: isRec ? C.red : C.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer' }}>
              {isRec ? <StopIcon size={26} /> : <MicIcon size={26} />}
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <span style={{ fontSize: 17, fontWeight: 600 }}>{cbTitle}</span>
                <span style={{ fontSize: 12, opacity: 0.9 }}>{cbSub}</span>
              </span>
            </button>
            <button onClick={openNewText} disabled={isRec} aria-label="Type a text comment here"
              style={{ width: 68, height: 68, flex: 'none', borderRadius: 8, border: `1.5px solid ${C.blue}`, background: '#fff', color: C.blue, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: dim, cursor: 'pointer' }}>
              <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>Aa</span>
              <span style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>Type</span>
            </button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.sub, padding: '8px 4px 0', opacity: dim }}>
              <input type="checkbox" checked={s.auto} disabled={isRec} onChange={() => update((p) => ({ ...p, auto: !p.auto }))} style={{ width: 16, height: 16, margin: 0 }} />
              Resume {studentName}’s answer after each comment
            </label>
          </div>

          {/* list header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: C.sub, padding: '6px 16px', height: 32, boxSizing: 'border-box' }}>
            <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your comments</span>
            {!s.follow && (
              <button onClick={() => update((p) => ({ ...p, follow: true }))} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: `1px solid ${C.blue}`, background: '#fff', color: C.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Follow playback</button>
            )}
          </div>

          {/* list */}
          <div ref={listRef} onWheel={() => s.follow && update((p) => ({ ...p, follow: false }))} onTouchMove={() => s.follow && update((p) => ({ ...p, follow: false }))}
            style={{ flex: 1, overflowY: 'auto', padding: '2px 12px 16px', position: 'relative' }}>
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
              {rows.map((row, idx) => {
                const divider = idx < rows.length - 1 ? `1px solid ${C.line}` : 'none';
                if (row.pending) {
                  return (
                    <div key={row.key} data-row={row.key} style={{ background: '#FEF2F2', borderBottom: divider, padding: '0 12px', height: 57, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 5, background: C.red }} />
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#991B1B' }}>
                        {s.rec!.overall ? 'Recording overall comment…' : `Recording at ${fmt(s.rec!.at)}…`}
                      </span>
                      <span style={{ fontSize: 13, color: '#991B1B', fontVariantNumeric: 'tabular-nums' }}>{fmt(s.rec!.len)}</span>
                    </div>
                  );
                }
                const c = row.c;
                const playing = s.playingId === c.id;
                const redoing = s.rec?.replaceId === c.id;
                const fresh = s.justSaved === c.id;
                const near = !s.rec && nearId === c.id;
                const title = c.overall ? 'Overall comment' : `Comment ${numOf[c.id]}`;
                const hasAudio = c.len > 0;
                const bg = redoing ? '#FEF2F2' : fresh ? '#DCE7FD' : near ? '#EEF4FF' : '#fff';
                return (
                  <div key={row.key} data-row={row.key} style={{ opacity: redoing ? 1 : dim, transition: 'opacity .2s, background .4s', background: bg, borderBottom: divider, padding: '6px 4px 6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => playComment(c)} disabled={isRec} aria-label={hasAudio ? `${playing ? 'Pause' : 'Play'} ${title}` : `Go to ${title}`}
                      style={{ ...roundBtn(44, '#E8EFFD', C.blue), position: 'relative', flex: 'none' }}>
                      {playing && <Ring pct={Math.min(1, s.playT / c.len)} />}
                      {playing ? <PauseIcon /> : hasAudio ? <PlayIcon /> : redoing ? null : <span style={{ fontSize: 15, fontWeight: 700 }}>Aa</span>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
                        {!c.overall && <span style={{ fontSize: 12, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>at {fmt(c.at)}</span>}
                      </div>
                      {c.text && (
                        <div style={{ fontSize: 13, lineHeight: 1.35, color: C.body, marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.text}</div>
                      )}
                    </div>
                    <button onClick={() => redo(c)} disabled={isRec} aria-label={`${hasAudio ? 'Redo audio for' : 'Add audio to'} ${title}`} style={{ ...iconBtn, width: 36 }}><MicIcon /></button>
                    <button onClick={() => editText(c)} disabled={isRec} aria-label={`${c.text ? 'Edit text of' : 'Add text to'} ${title}`} style={{ ...iconBtn, width: 36 }}><PencilIcon /></button>
                    <button onClick={() => del(c)} disabled={isRec} aria-label={`Delete ${title}`} style={{ ...iconBtn, width: 36 }}><TrashIcon /></button>
                  </div>
                );
              })}
            </div>
            {s.comments.length === 0 && !isRec && (
              <p style={{ fontSize: 13, color: C.sub, textAlign: 'center', padding: '16px 8px', margin: 0 }}>
                Play {studentName}’s answer and tap “Pause &amp; comment” whenever you notice something.
              </p>
            )}
          </div>

          {/* footer */}
          <div style={{ padding: '10px 12px 24px', background: '#fff', borderTop: `1px solid ${C.line}`, opacity: dim }}>
            <button onClick={goDone} disabled={isRec} style={{ width: '100%', height: 52, borderRadius: 8, border: `1.5px solid ${C.blue}`, background: '#fff', color: C.blue, fontSize: 17, fontWeight: 600, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}

      {s.screen === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, height: 760, padding: '0 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.sub }}>Previous screen</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{studentName}’s feedback summary</div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: C.body }}>Your existing screen, with all of {studentName}’s feedback and the Send button.</p>
          <button onClick={() => update((p) => ({ ...p, screen: 'edit' }))} style={{ height: 44, padding: '0 16px', borderRadius: 8, border: '1px solid #C9D3DE', background: '#fff', color: C.blue, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Open Question 2 again</button>
        </div>
      )}

      {s.drawer && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(19,32,43,0.4)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div role="dialog" aria-label="No overall comment" style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '10px 20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div aria-hidden="true" style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, background: '#D5DBE2' }} />
            <div style={{ fontSize: 19, fontWeight: 700, paddingTop: 4 }}>No overall comment</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: C.body }}>Add one to sum up {studentName}’s answer?</p>
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button onClick={() => update((p) => ({ ...p, drawer: false, screen: 'summary' }))}
                style={{ flex: 1, height: 52, borderRadius: 8, border: '1.5px solid #C9D3DE', background: '#fff', color: C.ink, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>No, I’m done</button>
              <button onClick={() => update((p) => ({ ...p, drawer: false, t: DUR, playing: false, replay: null, playingId: null, follow: true }))}
                style={{ flex: 1, height: 52, borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Add overall comment</button>
            </div>
          </div>
        </div>
      )}

      {s.tdraw && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(19,32,43,0.4)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div role="dialog" aria-label="Text comment" style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '10px 20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div aria-hidden="true" style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, background: '#D5DBE2' }} />
            <div style={{ fontSize: 19, fontWeight: 700, paddingTop: 4 }}>
              {s.tdraw.overall ? 'Overall comment' : `${s.tdraw.id != null ? 'Edit text' : 'Text comment'} · at ${fmt(s.tdraw.at)}`}
            </div>
            <label htmlFor="tc-text" style={{ fontSize: 12, color: C.sub }}>{studentName} will see this next to her answer</label>
            <textarea id="tc-text" autoFocus rows={4} value={s.draft} onChange={(e) => { const v = e.target.value; update((p) => ({ ...p, draft: v })); }}
              placeholder="e.g. through — not “thru”"
              style={{ fontFamily: 'inherit', fontSize: 16, lineHeight: 1.4, padding: '10px 12px', border: '1.5px solid #C9D3DE', borderRadius: 8, resize: 'none', color: C.ink }} />
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button onClick={() => update((p) => ({ ...p, tdraw: null, draft: '' }))}
                style={{ flex: 1, height: 52, borderRadius: 8, border: '1.5px solid #C9D3DE', background: '#fff', color: C.ink, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveText} disabled={!canSave}
                style={{ flex: 1, height: 52, borderRadius: 8, border: 'none', background: canSave ? C.blue : '#93B0F0', color: '#fff', fontSize: 15, fontWeight: 600, cursor: canSave ? 'pointer' : 'default' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
