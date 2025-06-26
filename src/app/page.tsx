'use client';

import Image from "next/image";
import Link from "next/link";
import { HomeStatistics } from "./components/HomeStatistics";
import { useTranslation } from "../utils/useTranslation";

export default function Home() {
  const { t } = useTranslation('home');

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-hust-red to-red-900">
        <div className="bg-gradient-to-b from-red-600/[.15] via-transparent">
          <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
            <div className="max-w-3xl text-center mx-auto">
              <h1 className="block font-medium text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                {t('hero.title')}
              </h1>
            </div>

            <div className="max-w-3xl text-center mx-auto">
              <p className="text-lg text-red-100">{t('hero.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card */}
          <div className="group flex flex-col h-full bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="h-52 flex flex-col justify-center items-center bg-hust-red rounded-t-xl">
              <svg className="w-28 h-28" width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="56" height="56" rx="10" fill="white" />
                <path d="M36.5 17.5H31.5C31.5 15.29 29.71 13.5 27.5 13.5C25.29 13.5 23.5 15.29 23.5 17.5H18.5C17.4 17.5 16.5 18.4 16.5 19.5V38.5C16.5 39.6 17.4 40.5 18.5 40.5H36.5C37.6 40.5 38.5 39.6 38.5 38.5V19.5C38.5 18.4 37.6 17.5 36.5 17.5ZM27.5 15.5C28.6 15.5 29.5 16.4 29.5 17.5H25.5C25.5 16.4 26.4 15.5 27.5 15.5ZM36.5 38.5H18.5V19.5H20.5V22.5C20.5 23.05 20.95 23.5 21.5 23.5C22.05 23.5 22.5 23.05 22.5 22.5V19.5H32.5V22.5C32.5 23.05 32.95 23.5 33.5 23.5C34.05 23.5 34.5 23.05 34.5 22.5V19.5H36.5V38.5Z" fill="#d9363e" />
                <path d="M22.5 29.5H31.5C32.05 29.5 32.5 29.05 32.5 28.5C32.5 27.95 32.05 27.5 31.5 27.5H22.5C21.95 27.5 21.5 27.95 21.5 28.5C21.5 29.05 21.95 29.5 22.5 29.5Z" fill="#d9363e" />
                <path d="M22.5 33.5H31.5C32.05 33.5 32.5 33.05 32.5 32.5C32.5 31.95 32.05 31.5 31.5 31.5H22.5C21.95 31.5 21.5 31.95 21.5 32.5C21.5 33.05 21.95 33.5 22.5 33.5Z" fill="#d9363e" />
                <path d="M22.5 25.5H31.5C32.05 25.5 32.5 25.05 32.5 24.5C32.5 23.95 32.05 23.5 31.5 23.5H22.5C21.95 23.5 21.5 23.95 21.5 24.5C21.5 25.05 21.95 25.5 22.5 25.5Z" fill="#d9363e" />
              </svg>
            </div>
            <div className="p-4 md:p-6">
              <h3 className="text-xl font-semibold text-gray-800">{t('features.papers.title')}</h3>
              <p className="mt-3 text-gray-500">{t('features.papers.description')}</p>
            </div>
          </div>
          {/* End Card */}

          {/* Card */}
          <div className="group flex flex-col h-full bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="h-52 flex flex-col justify-center items-center bg-hust-red-light rounded-t-xl">
              <svg className="w-28 h-28" width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="56" height="56" rx="10" fill="white" />
                <path d="M28 14C20.26 14 14 20.26 14 28C14 35.74 20.26 42 28 42C35.74 42 42 35.74 42 28C42 20.26 35.74 14 28 14ZM28 39.8C21.48 39.8 16.2 34.52 16.2 28C16.2 21.48 21.48 16.2 28 16.2C34.52 16.2 39.8 21.48 39.8 28C39.8 34.52 34.52 39.8 28 39.8Z" fill="#ff474c" />
                <path d="M28 22C25.24 22 23 24.24 23 27C23 27.55 23.45 28 24 28C24.55 28 25 27.55 25 27C25 25.34 26.34 24 28 24C29.66 24 31 25.34 31 27C31 28.66 29.66 30 28 30H25.5C24.95 30 24.5 30.45 24.5 31C24.5 31.55 24.95 32 25.5 32H28C30.76 32 33 29.76 33 27C33 24.24 30.76 22 28 22Z" fill="#ff474c" />
                <path d="M27 34C27 34.55 27.45 35 28 35C28.55 35 29 34.55 29 34C29 33.45 28.55 33 28 33C27.45 33 27 33.45 27 34Z" fill="#ff474c" />
                <path d="M35.03 24.5C35.28 25.29 35.41 26.13 35.41 27C35.41 27.82 35.3 28.62 35.1 29.38C34.96 29.94 35.29 30.52 35.85 30.67C35.94 30.69 36.03 30.7 36.11 30.7C36.58 30.7 37.01 30.38 37.13 29.9C37.38 28.97 37.51 27.99 37.51 27C37.51 25.94 37.36 24.91 37.06 23.94C36.9 23.38 36.32 23.05 35.75 23.21C35.19 23.38 34.87 23.94 35.03 24.5Z" fill="#ff474c" />
                <path d="M33.82 21.16C33.42 20.7 33 20.28 32.54 19.88C32.07 19.48 31.39 19.52 30.98 19.99C30.58 20.46 30.62 21.14 31.09 21.54C31.46 21.86 31.8 22.2 32.12 22.58C32.34 22.85 32.67 22.98 33 22.98C33.24 22.98 33.48 22.91 33.69 22.75C34.16 22.35 34.21 21.67 33.82 21.16Z" fill="#ff474c" />
              </svg>
            </div>
            <div className="p-4 md:p-6">
              <h3 className="text-xl font-semibold text-gray-800">{t('features.ai.title')}</h3>
              <p className="mt-3 text-gray-500">{t('features.ai.description')}</p>
            </div>
          </div>
          {/* End Card */}

          {/* Card */}
          <div className="group flex flex-col h-full bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="h-52 flex flex-col justify-center items-center bg-red-400 rounded-t-xl">
              <svg className="w-28 h-28" width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="56" height="56" rx="10" fill="white" />
                <path d="M40.5 16H38.5V14H36.5V16H19.5V14H17.5V16H15.5C14.4 16 13.5 16.9 13.5 18V40C13.5 41.1 14.4 42 15.5 42H40.5C41.6 42 42.5 41.1 42.5 40V18C42.5 16.9 41.6 16 40.5 16ZM40.5 40H15.5V23H40.5V40Z" fill="#f87171" />
                <path d="M22.5 31H20.5C19.95 31 19.5 31.45 19.5 32V34C19.5 34.55 19.95 35 20.5 35H22.5C23.05 35 23.5 34.55 23.5 34V32C23.5 31.45 23.05 31 22.5 31Z" fill="#f87171" />
                <path d="M29.5 31H27.5C26.95 31 26.5 31.45 26.5 32V34C26.5 34.55 26.95 35 27.5 35H29.5C30.05 35 30.5 34.55 30.5 34V32C30.5 31.45 30.05 31 29.5 31Z" fill="#f87171" />
                <path d="M36.5 31H34.5C33.95 31 33.5 31.45 33.5 32V34C33.5 34.55 33.95 35 34.5 35H36.5C37.05 35 37.5 34.55 37.5 34V32C37.5 31.45 37.05 31 36.5 31Z" fill="#f87171" />
                <path d="M22.5 25H20.5C19.95 25 19.5 25.45 19.5 26V28C19.5 28.55 19.95 29 20.5 29H22.5C23.05 29 23.5 28.55 23.5 28V26C23.5 25.45 23.05 25 22.5 25Z" fill="#f87171" />
                <path d="M29.5 25H27.5C26.95 25 26.5 25.45 26.5 26V28C26.5 28.55 26.95 29 27.5 29H29.5C30.05 29 30.5 28.55 30.5 28V26C30.5 25.45 30.05 25 29.5 25Z" fill="#f87171" />
                <path d="M36.5 25H34.5C33.95 25 33.5 25.45 33.5 26V28C33.5 28.55 33.95 29 34.5 29H36.5C37.05 29 37.5 28.55 37.5 28V26C37.5 25.45 37.05 25 36.5 25Z" fill="#f87171" />
              </svg>
            </div>
            <div className="p-4 md:p-6">
              <h3 className="text-xl font-semibold text-gray-800">{t('features.network.title')}</h3>
              <p className="mt-3 text-gray-500">{t('features.network.description')}</p>
            </div>
          </div>
          {/* End Card */}

          {/* AI Scientist Card */}
          <div className="group flex flex-col h-full bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="h-52 flex flex-col justify-center items-center bg-hust-red rounded-t-xl">
              <svg className="w-28 h-28" width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="56" height="56" rx="10" fill="white" />
                <path d="M28 14C20.26 14 14 20.26 14 28C14 35.74 20.26 42 28 42C35.74 42 42 35.74 42 28C42 20.26 35.74 14 28 14ZM28 39.8C21.48 39.8 16.2 34.52 16.2 28C16.2 21.48 21.48 16.2 28 16.2C34.52 16.2 39.8 21.48 39.8 28C39.8 34.52 34.52 39.8 28 39.8Z" fill="#d9363e" />
                <path d="M31 25.5H33C33.55 25.5 34 25.05 34 24.5C34 23.95 33.55 23.5 33 23.5H31C29.9 23.5 29 24.4 29 25.5V28.5H25V25.5C25 24.4 24.1 23.5 23 23.5H21C20.45 23.5 20 23.95 20 24.5C20 25.05 20.45 25.5 21 25.5H23V28.5C23 29.6 23.9 30.5 25 30.5H29C30.1 30.5 31 29.6 31 28.5V25.5Z" fill="#d9363e" />
                <path d="M28 32.5C27.17 32.5 26.5 33.17 26.5 34C26.5 34.83 27.17 35.5 28 35.5C28.83 35.5 29.5 34.83 29.5 34C29.5 33.17 28.83 32.5 28 32.5Z" fill="#d9363e" />
                <path d="M36 20.5C35.17 20.5 34.5 21.17 34.5 22C34.5 22.83 35.17 23.5 36 23.5C36.83 23.5 37.5 22.83 37.5 22C37.5 21.17 36.83 20.5 36 20.5Z" fill="#d9363e" />
                <path d="M20 20.5C19.17 20.5 18.5 21.17 18.5 22C18.5 22.83 19.17 23.5 20 23.5C20.83 23.5 21.5 22.83 21.5 22C21.5 21.17 20.83 20.5 20 20.5Z" fill="#d9363e" />
              </svg>
            </div>
            <div className="p-4 md:p-6">
              <h3 className="text-xl font-semibold text-gray-800">{t('features.scientist.title')}</h3>
              <p className="mt-3 text-gray-500">{t('features.scientist.description')}</p>
              <div className="mt-5">
                <Link href="/ai-scientist" className="inline-flex items-center gap-x-1 text-sm font-semibold text-hust-red hover:text-red-800">
                  {t('features.scientist.tryNow')}
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          {/* End AI Scientist Card */}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto bg-gray-50">
        <div className="mx-auto max-w-2xl mb-10 text-center">
          <h2 className="text-2xl font-bold md:text-3xl md:leading-tight text-gray-800">{t('statistics.title')}</h2>
          <p className="mt-3 text-gray-600">{t('statistics.subtitle')}</p>
        </div>

        <HomeStatistics />
      </div>

      {/* Footer */}
      <footer className="mt-auto w-full max-w-[85rem] py-10 px-4 sm:px-6 lg:px-8 mx-auto" style={{ backgroundColor: '#d9363e' }}>
        <div className="text-center">
          <div>
            <a className="flex-none text-xl font-semibold text-white" href="#" aria-label="Brand">Research Assistant</a>
          </div>

          <div className="mt-3">
            <p className="text-red-200">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
