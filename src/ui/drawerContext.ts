import { createContext, useContext, type ReactNode } from 'react';

export interface DrawerApi {
  open: (node: ReactNode) => void;
  close: () => void;
  /** While true, tapping the dimmed background doesn't close the drawer (e.g. while recording). */
  setLocked: (locked: boolean) => void;
}
export const DrawerContext = createContext<DrawerApi | null>(null);

export function useDrawer(): DrawerApi {
  const api = useContext(DrawerContext);
  if (!api) throw new Error('useDrawer outside DrawerProvider');
  return api;
}
