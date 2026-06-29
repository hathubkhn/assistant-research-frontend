'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { storeSsoAuthToken, syncAuthContextAfterSso } from '@/utils/ssoLogin'

const API_URL = process.env.NEXT_PUBLIC_API_URL

function MicrosoftCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checkAuth } = useAuth()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Processing Microsoft login...')
  const exchangedRef = useRef(false)

  useEffect(() => {
    const code = searchParams.get('code')

    if (!code) {
      router.push('/login?error=no_auth_code')
      return
    }

    if (exchangedRef.current) {
      return
    }
    exchangedRef.current = true

    const exchangeCodeForToken = async () => {
      try {
        setStatus('Received code, exchanging for token...')

        let deviceId = localStorage.getItem('deviceId')
        if (!deviceId) {
          deviceId = `web_${Math.random().toString(36).substring(2, 15)}`
          localStorage.setItem('deviceId', deviceId)
        }

        const res = await fetch(`${API_URL}/api/auth/microsoft/callback/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/sso-callback/microsoft`,
            device_id: deviceId,
            device_name: navigator.userAgent || 'Web Browser',
          }),
        })

        if (!res.ok) {
          const text = await res.text()
          console.error('Microsoft callback error:', res.status, text)
          setError(`Failed to authenticate with Microsoft (${res.status})`)
          setTimeout(
            () => router.push('/login?error=authentication_failed'),
            2000,
          )
          return
        }

        const data = await res.json()
        storeSsoAuthToken(data.token, 'microsoft')

        setStatus('Syncing session...')
        const synced = await syncAuthContextAfterSso(checkAuth)
        if (!synced) {
          setError('Authentication state sync failed')
          setTimeout(
            () => router.push('/login?error=authentication_failed'),
            2000,
          )
          return
        }

        router.push('/profile')
      } catch (err) {
        console.error('Microsoft auth error:', err)
        setError('An error occurred during Microsoft authentication')
        setTimeout(
          () => router.push('/login?error=authentication_failed'),
          2000,
        )
      }
    }

    void exchangeCodeForToken()
  }, [checkAuth, router, searchParams])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>
            {error ? 'Authentication Error' : 'Processing Microsoft Login...'}
          </h1>
          <div className='mt-4'>
            {!error ? (
              <>
                <div className='flex justify-center'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
                </div>
                <p className='mt-2 text-gray-600'>{status}</p>
              </>
            ) : (
              <div className='text-red-500'>{error}</div>
            )}
            <p className='mt-4 text-gray-600'>
              {error
                ? 'Redirecting back to login page...'
                : 'Please wait while we authenticate your account.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MicrosoftCallback() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-gray-100'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <MicrosoftCallbackContent />
    </Suspense>
  )
}
