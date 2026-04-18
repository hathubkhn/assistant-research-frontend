'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/utils/useTranslation'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Checkbox,
  Alert,
  Spin,
  Divider,
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  GoogleOutlined,
  WindowsOutlined,
  LoadingOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { Content } = Layout

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface LoginLinks {
  google_login: string;
  microsoft_login: string;
  token_login: string;
}

interface LoginFormData {
  username: string;
  password: string;
  remember?: boolean;
}

interface LoginResponse {
  token: string;
}

const fetchLoginLinksAPI = async (): Promise<LoginLinks> => {
  try {
    const response = await axios.get(`${API_URL}/api/login/`)
    return response.data
  } catch (error) {
    console.error('Login fetch error:', error)
    throw new Error('Failed to load login options')
  }
}

const loginWithCredentialsAPI = async (
  formData: LoginFormData,
): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${API_URL}/api/token-login/`, {
      username: formData.username,
      password: formData.password,
    })
    return response.data
  } catch (error: any) {
    console.error('Login failed:', error)
    if (error.response?.data) {
      const errorData = error.response.data
      if (errorData.non_field_errors) {
        throw new Error(errorData.non_field_errors[0])
      } else if (errorData.username) {
        throw new Error(`Username error: ${errorData.username[0]}`)
      } else if (errorData.password) {
        throw new Error(`Password error: ${errorData.password[0]}`)
      } else if (errorData.detail) {
        throw new Error(errorData.detail)
      }
    }
    throw new Error(
      'Login failed. Please check your credentials and try again.',
    )
  }
}

const testAuthTokenAPI = async (token: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_URL}/api/profile/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
    return response.status === 200
  } catch (error) {
    console.error('Test API call error:', error)
    return false
  }
}

function LoginForm() {
  const router = useRouter()
  const { checkAuth } = useAuth()
  const searchParams = useSearchParams()
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslation()
  const [loginLinks, setLoginLinks] = useState<LoginLinks>({
    google_login: '',
    microsoft_login: '',
    token_login: '',
  })

  useEffect(() => {
    const errorMsg = searchParams.get('error')
    if (errorMsg) {
      setError(
        errorMsg === 'authentication_failed'
          ? 'Authentication failed. Please try again.'
          : errorMsg === 'token_invalid'
            ? 'Your session has expired. Please log in again.'
            : 'An error occurred. Please try again.',
      )

      localStorage.removeItem('authToken')
    }

    const fetchLoginLinks = async () => {
      try {
        setIsLoading(true)
        const data = await fetchLoginLinksAPI()
        setLoginLinks(data)
      } catch (error: any) {
        console.error('Login fetch error:', error)
        setError(
          error.message || 'An error occurred while setting up login options',
        )
        setLoginLinks({
          google_login: 'https://accounts.google.com/o/oauth2/auth',
          microsoft_login:
            'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
          token_login: `${API_URL}/api/token-login/`,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLoginLinks()
  }, [searchParams])

  const handleSSOLogin = (provider: string) => {
    if (provider === 'google') {
      const googleOAuthUrl = 'https://accounts.google.com/o/oauth2/auth'
      const redirectUri = `${window.location.origin}/sso-callback/google`
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'email profile',
        access_type: 'offline',
        prompt: 'consent',
      })
      console.log(
        'Google OAuth URL:',
        `${googleOAuthUrl}?${params.toString()}`,
      )
      console.log('Google redirect URI:', redirectUri)
      window.location.href = `${googleOAuthUrl}?${params.toString()}`
    } else if (provider === 'microsoft') {
      const msOAuthUrl =
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
      const redirectUri = `${window.location.origin}/sso-callback/microsoft`
      const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || ''

      console.log('Microsoft client ID:', clientId)
      console.log('Microsoft redirect URI:', redirectUri)

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email User.Read',
        response_mode: 'query',
      })
      console.log('Microsoft OAuth URL:', `${msOAuthUrl}?${params.toString()}`)
      window.location.href = `${msOAuthUrl}?${params.toString()}`
    } else {
      setError(`${provider} login link is not available`)
    }
  }

  const handleSubmit = async (values: LoginFormData) => {
    try {
      setIsLoading(true)
      setError('')

      console.log('Attempting login to:', `${API_URL}/api/token-login/`)
      const data = await loginWithCredentialsAPI(values)

      console.log('Login successful, token received:', !!data.token)
      console.log(
        'Token value (first 10 chars):',
        data.token ? data.token.substring(0, 10) + '...' : 'No token',
      )

      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('authToken')
      localStorage.removeItem('authToken')

      let cleanToken = data.token
      if (cleanToken && cleanToken.startsWith('Token ')) {
        cleanToken = cleanToken.substring(6)
        console.log('Removed "Token " prefix from token')
      }

      localStorage.setItem('authToken', cleanToken)

      console.log('Token stored in localStorage. Current storage state:', {
        authToken: localStorage.getItem('authToken'),
      })

      const isTokenValid = await testAuthTokenAPI(cleanToken)
      if (isTokenValid) {
        console.log('Test API call successful')
      } else {
        console.warn('Test API call failed')
      }

      const authenticatedUser = await checkAuth()
      if (!authenticatedUser) {
        throw new Error('Authentication state sync failed. Please try again.')
      }

      router.push('/profile')
    } catch (error: any) {
      setError(
        error.message ||
          'An error occurred while trying to log in. Please try again later.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
      {error && (
        <Alert
          message='Login Error'
          description={error}
          type='error'
          showIcon
          style={{ marginBottom: 24 }}
          closable
          onClose={() => setError('')}
        />
      )}

      <Card style={{ padding: '24px 32px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          {t('auth.login')}
        </Title>

        <Form
          form={form}
          name='login'
          onFinish={handleSubmit}
          autoComplete='off'
          layout='vertical'
          size='large'
        >
          <Form.Item
            label={t('auth.email')}
            name='username'
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder='john@example.com'
              autoComplete='email'
            />
          </Form.Item>

          <Form.Item
            label={t('auth.password')}
            name='password'
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='********'
              autoComplete='current-password'
            />
          </Form.Item>

          <Row
            justify='space-between'
            align='middle'
            style={{ marginBottom: 24 }}
          >
            <Col>
              <Form.Item
                name='remember'
                valuePropName='checked'
                style={{ margin: 0 }}
              >
                <Checkbox>{t('auth.rememberMe')}</Checkbox>
              </Form.Item>
            </Col>
            <Col>
              <Button type='link' style={{ padding: 0 }}>
                {t('auth.forgotPassword')}
              </Button>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 24 }}>
            <Button
              type='primary'
              htmlType='submit'
              loading={isLoading}
              style={{ width: '100%', height: 48 }}
            >
              {t('auth.loginButton')}
            </Button>
          </Form.Item>

          <Divider style={{ margin: '24px 0' }}>
            <Text type='secondary'>{t('common.or')}</Text>
          </Divider>

          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            <Button
              icon={<GoogleOutlined />}
              onClick={() => handleSSOLogin('google')}
              style={{ width: '100%', height: 48 }}
              disabled={isLoading}
            >
              {t('auth.continueWithGoogle')}
            </Button>
            <Button
              icon={<WindowsOutlined />}
              onClick={() => handleSSOLogin('microsoft')}
              style={{ width: '100%', height: 48 }}
              disabled={isLoading}
            >
              {t('auth.continueWithMicrosoft')}
            </Button>
          </Space>
        </Form>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Text type='secondary'>
          {t('auth.noAccount')}{' '}
          <Link href='/signup'>
            <Button type='link' style={{ padding: 0 }}>
              {t('auth.signupButton')}
            </Button>
          </Link>
        </Text>
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Content
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '48px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <Title level={1} style={{ margin: 0, color: '#1890ff' }}>
            Research Assistant
          </Title>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          <Suspense
            fallback={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 200,
                }}
              >
                <Spin size='large' />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </Content>
  )
}
