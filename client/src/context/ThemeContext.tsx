import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isPresentationMode: boolean;
    togglePresentationMode: () => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Theme State
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme');
        return (saved === 'dark' || saved === 'light') ? saved : 'light'; // Default to Light
    });

    // Presentation Mode State
    const [isPresentationMode, setIsPresentationMode] = useState(false);

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const togglePresentationMode = () => {
        setIsPresentationMode(prev => !prev);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            isPresentationMode,
            togglePresentationMode,
            isSidebarOpen,
            toggleSidebar
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
