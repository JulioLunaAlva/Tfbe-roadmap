import React, { createContext, useContext, useState, useEffect } from 'react';

interface YearContextType {
    year: number;
    setYear: (year: number) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export const YearProvider = ({ children }: { children: React.ReactNode }) => {
    const [year, setYear] = useState(new Date().getFullYear());

    return (
        <YearContext.Provider value={{ year, setYear }}>
            {children}
        </YearContext.Provider>
    );
};

export const useYear = () => {
    const context = useContext(YearContext);
    if (context === undefined) {
        throw new Error('useYear must be used within a YearProvider');
    }
    return context;
};
