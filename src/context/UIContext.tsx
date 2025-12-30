'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIContextType {
    hasEntered: boolean;
    setHasEntered: (value: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [hasEntered, setHasEntered] = useState(false);

    useEffect(() => {
        // Check session storage on mount
        const hasVisited = sessionStorage.getItem('hasVisited');
        // Check if we are on an inner page (not root)
        const isInnerPage = window.location.pathname !== '/';

        if (hasVisited || isInnerPage) {
            setHasEntered(true);
        }
    }, []);

    const handleSetEntered = (value: boolean) => {
        setHasEntered(value);
        if (value) {
            sessionStorage.setItem('hasVisited', 'true');
        }
    };

    return (
        <UIContext.Provider value={{ hasEntered, setHasEntered: handleSetEntered }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
