import { createLocalizedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['en', 'vi'] as const;
export type Locale = (typeof locales)[number];

export const getTranslations = async (locale: string, namespace: string) => {
    try {
        const translations = await import(`../public/locales/${locale}/${namespace}.json`);
        return translations.default;
    } catch (error) {
        console.error(`Failed to load translations for ${locale}/${namespace}`, error);
        return {};
    }
};

export const { Link, redirect, usePathname, useRouter } =
    createLocalizedPathnamesNavigation({
        locales,
        pathnames: {
            '/': '/',
            '/dashboard': '/dashboard',
            '/papers': '/papers',
            '/journals': '/journals',
            '/conferences': '/conferences',
            '/datasets': '/datasets',
            '/research-assistant': '/research-assistant',
            '/ai-scientist': '/ai-scientist',
            '/my-library': '/my-library',
            '/login': '/login',
            '/signup': '/signup',
            '/profile': '/profile',
        }
    }); 