'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { storeSsoAuthToken, syncAuthContextAfterSso } from '@/utils/ssoLogin'

function SSOCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checkAuth } = useAuth()
  const [error, setError] = useState('')
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) {
      return
    }
    handledRef.current = true

    const finishLogin = async () => {
      const token = searchParams.get('token')
      const provider = searchParams.get('provider') || 'sso'

      if (!token) {
        router.push('/login?error=no_token')
        return
      }

      storeSsoAuthToken(token, provider)
      const synced = await syncAuthContextAfterSso(checkAuth)
      if (!synced) {
        setError('Authentication state sync failed')
        setTimeout(() => router.push('/login?error=authentication_failed'), 2000)
        return
      }

      router.push('/profile')
    }

    void finishLogin()
  }, [checkAuth, router, searchParams])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>
            {error ? 'Authentication Error' : 'Processing login...'}
          </h1>
          <div className='mt-4'>
            {!error ? (
              <div className='flex justify-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
              </div>
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

export default function SSOCallback() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-gray-100'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <SSOCallbackContent />
    </Suspense>
  )
}
