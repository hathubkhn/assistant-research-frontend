'use client'

import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'

type TranslationDict = {
    [key: string]: string | TranslationDict;
};

type Translations = {
    [locale: string]: {
        [namespace: string]: TranslationDict;
    };
};

// Cache for loaded translations
const translationsCache: Translations = {
    en: {},
    vi: {},
}

export function useTranslation(namespace: string = 'common') {
    const { language } = useLanguage()
    const [translations, setTranslations] = useState<TranslationDict>({})
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadTranslations() {
            setIsLoading(true)
            try {
                // Check if we already have this translation in cache
                if (translationsCache[language]?.[namespace]) {
                    setTranslations(translationsCache[language][namespace])
                } else {
                    // Load translation from file
                    const response = await fetch(`/locales/${language}/${namespace}.json`)
                    if (!response.ok) {
                        throw new Error(`Failed to load ${language}/${namespace} translations`)
                    }
                    const data = await response.json()

                    // Cache the translation
                    if (!translationsCache[language]) {
                        translationsCache[language] = {}
                    }
                    translationsCache[language][namespace] = data

                    setTranslations(data)
                }
            } catch (error) {
                console.error('Translation loading error:', error)
                // Fall back to empty translations
                setTranslations({})
            } finally {
                setIsLoading(false)
            }
        }

        loadTranslations()
    }, [language, namespace])

    const t = (key: string, params: Record<string, string> = {}) => {
        if (isLoading) return key

        // Handle nested keys like 'header.home'
        const keys = key.split('.')
        let value: any = translations

        for (const k of keys) {
            if (value === undefined) return key
            value = value[k]
        }

        if (typeof value !== 'string') return key

        // Replace parameters in the string if any
        let result = value
        Object.entries(params).forEach(([paramKey, paramValue]) => {
            result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue)
        })

        return result
    }

    return { t, isLoading }
}
