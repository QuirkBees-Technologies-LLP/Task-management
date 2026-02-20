'use client';

import React, { createContext, useContext, useState } from 'react';
import { getTheme } from './theme';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { blue } from '@mui/material/colors';

interface ThemeConfig {
  primaryColor: string;
  fontFamily: string;
}

const ThemeContext = createContext<any>(null);

export const useThemeContext = () => {
  return useContext(ThemeContext);
};

export const initialTheme: ThemeConfig = {
  primaryColor: blue[500],
  fontFamily: 'Poppins',
};

export default function CustomTheme({ children }) {
  const [themeConfig, setThemeConfig] = useState(initialTheme);

  const handleChangePrimaryColor = (newColor: string) => {
    setThemeConfig({
      ...themeConfig,
      primaryColor: newColor,
    });
  };

  const handleChangeFontFamily = (newFont: string) => {
    setThemeConfig({
      ...themeConfig,
      fontFamily: newFont,
    });
  };

  const theme = getTheme({
    primaryColor: themeConfig.primaryColor,
    fontFamily: themeConfig.fontFamily,
  });

  return (
    <ThemeContext.Provider
      value={{
        handleChangePrimaryColor,
        handleChangeFontFamily,
      }}
    >
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline enableColorScheme />
        <main>{children}</main>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
