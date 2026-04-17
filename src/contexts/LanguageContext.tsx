'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'vi';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const defaultState: LanguageContextType = {
    language: 'en',
    setLanguage: () => { },
}

const LanguageContext = createContext<LanguageContextType>(defaultState)

export const useLanguage = () => useContext(LanguageContext)

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en')

    useEffect(() => {
        const savedLanguage = localStorage.getItem('language') as Language
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
            setLanguageState(savedLanguage)
            document.documentElement.lang = savedLanguage
        }
    }, [])

    useEffect(() => {
        // Update HTML lang attribute whenever language changes
        document.documentElement.lang = language
    }, [language])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem('language', lang)
        document.documentElement.lang = lang
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    )
}
