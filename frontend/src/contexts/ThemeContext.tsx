// Import React hooks and types for theme management
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the available theme type (currently only dark mode)
type Theme = 'dark';

// Define the shape of our theme context
interface ThemeContextType {
  theme: Theme; // Current theme value
}

// Define props for the ThemeProvider component
interface ThemeProviderProps {
  children: ReactNode; // Child components that will have access to theme
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Main theme provider component that wraps the app
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Set theme to always be dark mode (no state changes needed)
  const [theme] = useState<Theme>('dark'); // Always dark mode

  // Apply theme to the document and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement; // Get the HTML element
    // Remove any existing theme classes
    root.classList.remove('light', 'dark');
    // Add the current theme class
    root.classList.add(theme);
    // Save theme preference to browser storage
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {/* Provide theme context to all child components */}
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context in components
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  // Make sure this hook is used inside a ThemeProvider
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
