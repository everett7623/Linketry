import React, { createContext, useContext } from 'react';
import { useUpdateCheck } from '../hooks/useUpdateCheck';

type UpdateCheckContextValue = ReturnType<typeof useUpdateCheck>;

const UpdateCheckContext = createContext<UpdateCheckContextValue | null>(null);

export function UpdateCheckProvider({ children }: { children: React.ReactNode }) {
  const value = useUpdateCheck();
  return <UpdateCheckContext.Provider value={value}>{children}</UpdateCheckContext.Provider>;
}

export function useUpdateCheckContext() {
  const context = useContext(UpdateCheckContext);
  if (!context) throw new Error('useUpdateCheckContext must be used within UpdateCheckProvider');
  return context;
}
