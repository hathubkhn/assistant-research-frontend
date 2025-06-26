'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/useTranslation';
import React, { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close the dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleLanguage = (lang: 'en' | 'vi') => {
        setLanguage(lang);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center text-white hover:text-red-200 focus:outline-none"
                aria-label="Change language"
            >
                {language === 'en' ? (
                    <span className="flex items-center">
                        <img src="/flags/us.svg" alt="English" className="w-6 h-4 mr-1" />
                    </span>
                ) : (
                    <span className="flex items-center">
                        <img src="/flags/vn.svg" alt="Tiếng Việt" className="w-6 h-4 mr-1" />
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                        onClick={() => toggleLanguage('en')}
                        className={`block w-full text-left px-4 py-2 text-sm flex items-center ${language === 'en' ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                        <img src="/flags/us.svg" alt="English" className="w-6 h-4 mr-2" />
                        {t('languages.english')}
                    </button>
                    <button
                        onClick={() => toggleLanguage('vi')}
                        className={`block w-full text-left px-4 py-2 text-sm flex items-center ${language === 'vi' ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                        <img src="/flags/vn.svg" alt="Tiếng Việt" className="w-6 h-4 mr-2" />
                        {t('languages.vietnamese')}
                    </button>
                </div>
            )}
        </div>
    );
} 