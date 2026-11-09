import { createContext, useContext, type ReactNode } from 'react';

export interface DrawerApi {
  open: (node: ReactNode) => void;
  close: () => void;
}
export const DrawerContext = createContext<DrawerApi | null>(null);

export function useDrawer(): DrawerApi {
  const api = useContext(DrawerContext);
  if (!api) throw new Error('useDrawer outside DrawerProvider');
  return api;
}
