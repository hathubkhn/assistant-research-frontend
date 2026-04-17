'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL

function MicrosoftCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Processing Microsoft login...')

  useEffect(() => {
    const code = searchParams.get('code')

    if (!code) {
      // No authorization code received
      router.push('/login?error=no_auth_code')
      return
    }

    // Exchange the code for a token
    const exchangeCodeForToken = async () => {
      try {
        setStatus('Received code, exchanging for token...')
        console.log('Sending code to backend:', code)
        console.log('Using API URL:', API_URL)

        // Generate a unique device ID if not already stored
        let deviceId = localStorage.getItem('deviceId')
        if (!deviceId) {
          deviceId = `web_${Math.random().toString(36).substring(2, 15)}`
          localStorage.setItem('deviceId', deviceId)
        }

        // Call your backend to exchange the code for a token using XMLHttpRequest
        // instead of fetch to avoid CORS issues and get more detailed errors
        const deviceName = navigator.userAgent || 'Web Browser'
        const callbackUrl = `${API_URL}/api/auth/microsoft/callback/`
        const xhr = new XMLHttpRequest()

        xhr.open('POST', callbackUrl, true)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            setStatus('Received token, storing and redirecting...')
            try {
              const data = JSON.parse(xhr.responseText)
              // Store token in localStorage
              localStorage.setItem('authToken', data.token)
              localStorage.setItem('authProvider', 'microsoft')

              // Redirect to home page
              router.push('/')
            } catch (parseError) {
              console.error('Failed to parse response:', parseError)
              setError('Failed to process Microsoft authentication response')
              setTimeout(
                () => router.push('/login?error=response_parsing_failed'),
                2000,
              )
            }
          } else {
            console.error(
              'Error from callback endpoint:',
              xhr.status,
              xhr.responseText,
            )
            setError(`Failed to authenticate with Microsoft (${xhr.status})`)
            setTimeout(
              () => router.push('/login?error=authentication_failed'),
              2000,
            )
          }
        }
        xhr.onerror = function () {
          console.error('Request failed:', xhr.responseText)
          setError('Network error during Microsoft authentication')
          setTimeout(() => router.push('/login?error=network_error'), 2000)
        }

        xhr.send(
          JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/sso-callback/microsoft`,
            device_id: deviceId,
            device_name: deviceName,
          }),
        )
      } catch (error) {
        console.error('Microsoft auth error:', error)
        setError('An error occurred during Microsoft authentication')
        setTimeout(
          () => router.push('/login?error=authentication_failed'),
          2000,
        )
      }
    }

    exchangeCodeForToken()
  }, [router, searchParams])

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
