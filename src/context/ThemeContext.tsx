import React, { createContext, useContext, useState } from 'react';
import { LuminaTokens, ThemeTokens } from '../tokens';

interface ThemeContextValue {
  dark: boolean;
  T: ThemeTokens;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  dark: true,
  T: LuminaTokens.dark,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);
  const T = dark ? LuminaTokens.dark : LuminaTokens.light;

  return (
    <ThemeContext.Provider value={{ dark, T, toggleTheme: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
