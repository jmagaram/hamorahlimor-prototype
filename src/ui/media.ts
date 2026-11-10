import { useEffect, useRef } from 'react';

/** Calls `tick(dt)` every 100 ms while `on`, with dt in seconds. */
export function useTicker(on: boolean, tick: (dt: number) => void) {
  const ref = useRef(tick);
  useEffect(() => { ref.current = tick; });
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => ref.current(0.1), 100);
    return () => clearInterval(t);
  }, [on]);
}

// Media symbols; U+FE0E asks for the plain text glyph, not the color emoji (iOS).
export const PLAY = '\u25B6\uFE0E';
export const PAUSE = '\u23F8\uFE0E';
export const BACK = '\u23EA\uFE0E';
export const FORWARD = '\u23E9\uFE0E';

