'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import NotificationBell from './NotificationBell'

export default function Header() {
    const { user, loading, logout, checkAuth } = useAuth()
    const router = useRouter()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [loginDropdownOpen, setLoginDropdownOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const loginDropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
            if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target as Node)) {
                setLoginDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [dropdownRef, loginDropdownRef])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search?query=${encodeURIComponent(searchQuery)}`)
            setSearchQuery('')
            setIsSearchFocused(false)
        }
    }

    const handleLogout = async () => {
        await logout()
        router.push('/login')
    }

    // Handler for My Library navigation with authentication check
    const handleMyLibraryClick = (e: React.MouseEvent) => {
        e.preventDefault()
        console.log('My Library clicked, auth status:', {
            userExists: !!user,
            userData: user,
            authToken: localStorage.getItem('authToken'),
            loading,
        })

        if (user) {
            router.push('/my-library')
        } else {
            // Check if we're currently loading auth state
            if (loading) {
                console.log('Auth still loading, please wait...')
                // Optional: Show a loading indicator instead of redirecting
                return
            }

            // Check if token exists but user object doesn't
            const token = localStorage.getItem('authToken')
            if (token) {
                console.log('Token exists but user data is missing, forcing recheck')
                // Try to force a recheck of authentication
                checkAuth().then(() => {
                    // If user is authenticated after recheck, go to library
                    if (user) {
                        router.push('/my-library')
                    } else {
                        router.push('/login')
                    }
                })
            } else {
                console.log('No token found, redirecting to login')
                router.push('/login')
            }
        }
    }

    return (
        <header className='bg-[#1e40af] shadow-sm'>
            <div className='container mx-auto px-4 py-3 flex justify-between items-center' suppressHydrationWarning={true}>
                <a href='/' className='text-xl font-bold text-white'>Research Assistant</a>
                <nav className='flex-grow flex justify-center'>
                    <ul className='flex space-x-6'>
                        <li><a href='/' className='text-white hover:text-blue-200'>Home</a></li>
                        <li><a href='/dashboard' className='text-white hover:text-blue-200'>Dashboard</a></li>
                        <li><a href='/papers' className='text-white hover:text-blue-200'>Papers</a></li>
                        <li><a href='/journals' className='text-white hover:text-blue-200'>Journals</a></li>
                        <li><a href='/conferences' className='text-white hover:text-blue-200'>Conferences</a></li>
                        <li><a href='/datasets' className='text-white hover:text-blue-200'>Datasets</a></li>
                        <li><a href='/research-assistant' className='text-white hover:text-blue-200'>Research Assistant</a></li>
                        <li><a href='#' onClick={handleMyLibraryClick} className='text-white hover:text-blue-200'>My Library</a></li>
                    </ul>
                </nav>

                <div className='flex items-center space-x-4' suppressHydrationWarning={true}>
                    {/* Search component */}
                    <div className='relative' suppressHydrationWarning={true}>
                        <form onSubmit={handleSearch} className='flex items-center'>
                            <input
                                ref={searchInputRef}
                                type='text'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                placeholder='Tìm kiếm...'
                                className={`bg-blue-700 text-white placeholder-blue-300 border border-blue-600 rounded-full py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white ${isSearchFocused || searchQuery ? 'w-48' : 'w-32'} transition-all duration-300`}
                            />
                            <button
                                type='submit'
                                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white focus:outline-none'
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                                </svg>
                            </button>
                        </form>
                    </div>

                    {/* Auth-related UI */}
                    {loading ? (
                        // Loading state
                        <div className='w-8 h-8 rounded-full bg-blue-300 animate-pulse' suppressHydrationWarning={true}></div>
                    ) : user ? (
                        // Logged in state with notification bell and avatar
                        <>
                            {/* Notification Bell */}
                            <NotificationBell />

                            {/* User Avatar */}
                            <div className='relative' ref={dropdownRef} suppressHydrationWarning={true}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className='flex items-center focus:outline-none'
                                >
                                    {user.profile?.avatar_url ? (
                                        <img
                                            src={user.profile.avatar_url}
                                            alt='Profile'
                                            className='w-8 h-8 rounded-full object-cover border-2 border-white'
                                        />
                                    ) : (
                                        <div className='w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold' suppressHydrationWarning={true}>
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </button>

                                {/* Dropdown menu */}
                                {dropdownOpen && (
                                    <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10' suppressHydrationWarning={true}>
                                        <div className='px-4 py-2 text-sm text-gray-700 border-b' suppressHydrationWarning={true}>
                                            <div className='font-medium' suppressHydrationWarning={true}>{user.profile?.full_name || user.username}</div>
                                            <div className='text-gray-400 text-xs truncate' suppressHydrationWarning={true}>{user.email}</div>
                                        </div>
                                        <Link
                                            href='/profile'
                                            className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                        >
                                            View Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        // Logged out state - Icon only
                        <div className='relative' ref={loginDropdownRef} suppressHydrationWarning={true}>
                            <button
                                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                                className='flex items-center text-white hover:text-blue-200 focus:outline-none'
                            >
                                <svg className='w-5 h-5' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                </svg>
                            </button>

                            {/* Login Dropdown menu */}
                            {loginDropdownOpen && (
                                <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10' suppressHydrationWarning={true}>
                                    <Link
                                        href='/profile'
                                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                    >
                                        View Profile
                                    </Link>
                                    <Link
                                        href='/login'
                                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                    >
                                        Sign out
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
