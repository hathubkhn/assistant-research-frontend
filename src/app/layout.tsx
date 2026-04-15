'use client'

import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import PrelineScript from '../components/PrelineScript'
import { AuthProvider } from '../contexts/AuthContext'
import { LanguageProvider } from '../contexts/LanguageContext'
import Header from '../components/Header'
import { useEffect } from 'react'
import { ConfigProvider } from 'antd'

export function removeBisSkinCheckedAttributes() {
  try {
    const elements = document.querySelectorAll('[bis_skin_checked]')
    elements.forEach(el => el.removeAttribute('bis_skin_checked'))

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
          (mutation.target as Element).removeAttribute('bis_skin_checked')
        }
      }
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['bis_skin_checked'],
      subtree: true,
    })

    return () => observer.disconnect()
  } catch (e) {
    console.error('Error removing bis_skin_checked attributes:', e)
  }
}

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default function RootLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage) {
      document.documentElement.lang = savedLanguage
    }
    removeBisSkinCheckedAttributes()
  }, [])

  return (
    <html>
      <head>
        <title>Research Assistant</title>
        <meta name='description' content='AI-powered research assistant for academic papers' />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#d9363e',
              borderRadius: 8,
            },
          }}
        >
          <AuthProvider>
            <LanguageProvider>
              <Header />
              <main>
                {children}
              </main>
              <PrelineScript />
            </LanguageProvider>
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  )
}
