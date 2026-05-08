import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [appearance, setAppearance] = useState('system');

  useEffect(() => {
    // Load appearance preference on mount
    const savedAppearance = localStorage.getItem('appearance') || 'system';
    setAppearance(savedAppearance);
    applyAppearance(savedAppearance);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (savedAppearance === 'system') {
        applyAppearance('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyAppearance = (mode) => {
    const html = document.documentElement;

    if (mode === 'dark') {
      html.setAttribute('data-bs-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else if (mode === 'light') {
      html.setAttribute('data-bs-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    } else {
      // System mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.setAttribute('data-bs-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        html.setAttribute('data-bs-theme', 'light');
        document.documentElement.style.colorScheme = 'light';
      }
    }
  };

  const handleAppearanceChange = (mode) => {
    setAppearance(mode);
    localStorage.setItem('appearance', mode);
    applyAppearance(mode);
  };

  return (
    <ThemeContext.Provider value={{ appearance, handleAppearanceChange }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
