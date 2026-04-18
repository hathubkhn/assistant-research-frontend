'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth, hasAuthToken, resolveApiAssetUrl } from '../utils/auth'

type Profile = {
  userId: number;
  full_name: string;
  avatar_url: string | null;
};

type User = {
  id: number;
  username: string;
  email: string;
  profile: Profile | null;
};

type ProfileApiResponse = {
  id?: number;
  userId?: number;
  username?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string | null;
  profile?: {
    userId?: number;
    full_name?: string;
    avatar_url?: string | null;
  } | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => void;
  checkAuth: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  checkAuth: async () => null,
})

const isBrowser = () => typeof window !== 'undefined'

const normalizeUserPayload = (
  payload: ProfileApiResponse,
  apiUrl: string,
): User | null => {
  if (!payload || !payload.id || !payload.username || !payload.email) {
    return null
  }

  const nestedProfile = payload.profile
  const rawAvatarUrl =
    nestedProfile && 'avatar_url' in nestedProfile
      ? nestedProfile.avatar_url
      : payload.avatar_url

  const normalizedAvatarUrl = resolveApiAssetUrl(rawAvatarUrl ?? null, apiUrl)
  const fullName = nestedProfile?.full_name ?? payload.full_name ?? ''
  const profileUserId = nestedProfile?.userId ?? payload.userId ?? payload.id

  return {
    id: payload.id,
    username: payload.username,
    email: payload.email,
    profile: {
      userId: profileUserId,
      full_name: fullName,
      avatar_url: normalizedAvatarUrl,
    },
  }
}

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

  const checkAuth = async (): Promise<User | null> => {
    setLoading(true)
    try {
      if (!isBrowser()) {
        setLoading(false)
        return null
      }

      if (!hasAuthToken()) {
        console.log('Auth context - No token found')
        setUser(null)
        setLoading(false)
        return null
      }

      const userEndpoint = `${API_URL}/api/profile/`
      console.log('Auth context - Fetching user data from:', userEndpoint)
      console.log('Auth context - Current token state:', {
        authToken: localStorage.getItem('authToken'),
        token: localStorage.getItem('token'),
      })

      try {
        const token = localStorage.getItem('authToken')
        const response = await fetchWithAuth(userEndpoint, {
          headers: {
            Authorization: `Token ${token}`,
          },
          credentials: 'include',
        })

        console.log(
          'Auth context - User API response status:',
          response.status,
        )

        if (response.ok) {
          const userData = await response.json()
          const normalizedUser = normalizeUserPayload(userData, API_URL)

          if (!normalizedUser) {
            console.error(
              'Auth context - Invalid user payload shape',
              userData,
            )
            setUser(null)
            return null
          }

          console.log(
            'Auth context - User data loaded successfully:',
            normalizedUser,
          )
          setUser(normalizedUser)
          return normalizedUser
        } else if (response.status === 401) {
          console.warn('Auth context - Token is invalid or expired')
          // Clear invalid token
          localStorage.removeItem('authToken')
          localStorage.removeItem('token')
          sessionStorage.removeItem('authToken')
          sessionStorage.removeItem('token')
          setUser(null)
          window.location.href = '/login?error=token_invalid'
          return null
        } else if (response.status === 503) {
          try {
            const errorData = await response.json()
            console.error('Auth context - Network error:', errorData)
          } catch (e) {
            console.error(
              'Auth context - Network error, could not parse response',
            )
          }
          setUser(null)
          return null
        } else {
          // Other API errors
          try {
            const errorText = await response.text()
            console.error(
              'Auth context - Failed to load user data, status:',
              response.status,
            )
            console.error('Auth context - Error details:', errorText)
          } catch (e) {
            console.error(
              'Auth context - Failed to load user data, status:',
              response.status,
            )
          }
          setUser(null)
          return null
        }
      } catch (fetchError) {
        console.error('Auth context - API connection error:', fetchError)
        setUser(null)
        return null
      }
    } catch (error) {
      console.error('Authentication check error:', error)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    if (isBrowser()) {
      localStorage.removeItem('authToken')
    }
    setUser(null)
    router.push('/login')
  }

  useEffect(() => {
    void checkAuth()
  }, [])

  return (
    <div suppressHydrationWarning={true}>
      <AuthContext.Provider value={{ user, loading, logout, checkAuth }}>
        {children}
      </AuthContext.Provider>
    </div>
  )
}
