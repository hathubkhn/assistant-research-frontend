'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PrelineScript from "../components/PrelineScript";
import { AuthProvider } from "../contexts/AuthContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import Header from "../components/Header";
import { useEffect, useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mounted, setMounted] = useState(false);

  // Set default language from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      document.documentElement.lang = savedLanguage;
    }
  }, []);

  return (
    <html>
      <head>
        <title>Research Assistant</title>
        <meta name="description" content="AI-powered research assistant for academic papers" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {/* Script to remove bis_skin_checked attributes */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Execute immediately to remove attributes before hydration
                try {
                  const elements = document.querySelectorAll('[bis_skin_checked]');
                  elements.forEach(el => el.removeAttribute('bis_skin_checked'));
                  
                  // Also use a MutationObserver to catch any that might be added later
                  const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                      if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                        mutation.target.removeAttribute('bis_skin_checked');
                      }
                    }
                  });
                  
                  // Start observing the document
                  observer.observe(document.body, { 
                    attributes: true,
                    attributeFilter: ['bis_skin_checked'],
                    subtree: true 
                  });
                } catch (e) {
                  console.error('Error removing bis_skin_checked attributes:', e);
                }
              })();
            `,
          }}
        />
        <AuthProvider>
          <LanguageProvider>
            <Header />
            <main>
              {children}
            </main>
            <PrelineScript />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
