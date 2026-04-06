'use client';

import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
    hasEntered: boolean;
    setHasEntered: (value: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

function getInitialHasEntered(): boolean | null {
    if (typeof window === 'undefined') return null;
    const visited = sessionStorage.getItem('hasVisited');
    const notHomePage = window.location.pathname !== '/';
    return !!(visited || notHomePage);
}

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [hasEntered, setHasEntered] = useState<boolean | null>(getInitialHasEntered);

    const handleSetEntered = (value: boolean) => {
        setHasEntered(value);
        if (value) {
            sessionStorage.setItem('hasVisited', 'true');
        }
    };

    return (
        <UIContext.Provider value={{ hasEntered: hasEntered ?? true, setHasEntered: handleSetEntered }}>
            {children}
        </UIContext.Provider>
    );
}

// Expose whether the state is still loading (for components that need to wait)
export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
