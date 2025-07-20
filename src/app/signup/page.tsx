'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
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
  Select,
  Steps
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  BankOutlined,
  BookOutlined,
  TeamOutlined,
  LinkOutlined,
  ExperimentOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { TextArea } = Input;
const { Step } = Steps;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const RESEARCH_AREAS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Data Science',
  'Bioinformatics',
  'Robotics',
  'Human-Computer Interaction',
  'Cybersecurity',
  'Internet of Things',
  'Cloud Computing',
  'Big Data',
  'Software Engineering',
  'Network Systems',
  'Quantum Computing',
  'Blockchain',
  'Virtual Reality',
  'Augmented Reality',
  'Mobile Computing',
  'Embedded Systems'
];

interface ProfileData {
  full_name: string;
  faculty_institute: string;
  school: string;
  keywords: string;
  position: string;
  google_scholar_link: string;
}

interface DirectSignupData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  full_name: string;
  faculty_institute: string;
  school: string;
  position: string;
  research_interests: string[];
  custom_keywords: string;
  google_scholar_link: string;
  bio: string;
}

interface UserProfileResponse {
  full_name?: string;
  faculty_institute?: string;
  school?: string;
  keywords?: string;
  position?: string;
  google_scholar_link?: string;
  is_profile_completed?: boolean;
}

interface RegisterResponse {
  token?: string;
}

// API Functions
const fetchUserProfileAPI = async (token: string): Promise<UserProfileResponse> => {
  try {
    const response = await axios.get(`${API_URL}/api/profile/`, {
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

const updateProfileAPI = async (profileData: ProfileData): Promise<void> => {
  try {
    const token = localStorage.getItem('authToken');
    await axios.put(`${API_URL}/api/profile/update/`, profileData, {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Failed to update profile');
  }
};

const registerUserAPI = async (userData: any): Promise<RegisterResponse> => {
  try {
    const response = await axios.post(`${API_URL}/api/register/`, userData);
    return response.data;
  } catch (error: any) {
    console.error('Registration failed:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.non_field_errors) {
        throw new Error(errorData.non_field_errors[0]);
      }
      // Return the full error data for field-specific errors
      throw error.response.data;
    }
    throw new Error('Registration failed. Please try again.');
  }
};

const updateProfileAfterRegisterAPI = async (token: string, profileData: any): Promise<void> => {
  try {
    await axios.put(`${API_URL}/api/profile/`, profileData, {
      headers: {
        'Authorization': `Token ${token}`,
      }
    });
  } catch (error: any) {
    console.error('Profile update after registration failed:', error);
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Failed to update profile after registration');
  }
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [profileForm] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const token = searchParams.get('token');
  const provider = searchParams.get('provider');
  const isNewUser = searchParams.get('is_new') === 'True';

  const [isTokenFlow, setIsTokenFlow] = useState(false);
  const [selectedResearchAreas, setSelectedResearchAreas] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      setIsTokenFlow(true);

      const fetchUserProfile = async () => {
        try {
          const data = await fetchUserProfileAPI(token);
          profileForm.setFieldsValue({
            full_name: data.full_name || '',
            faculty_institute: data.faculty_institute || '',
            school: data.school || '',
            keywords: data.keywords || '',
            position: data.position || '',
            google_scholar_link: data.google_scholar_link || '',
          });

          if (data.is_profile_completed) {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };

      fetchUserProfile();
    }
  }, [token, router, profileForm]);

  const handleProfileSubmit = async (values: ProfileData) => {
    try {
      setIsLoading(true);
      setError('');
      
      await updateProfileAPI(values);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectSignup = async (values: any) => {
    try {
      setIsLoading(true);
      setError('');
      setUsernameError('');
      setEmailError('');

      console.log('Starting signup process');

      if (values.password !== values.password2) {
        setError('Passwords do not match');
        return;
      }

      const keywords = [
        ...selectedResearchAreas,
        ...(values.custom_keywords ? values.custom_keywords.split(',').map((k: string) => k.trim()) : [])
      ].join(', ');

      const userData = {
        username: values.username,
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        full_name: `${values.first_name} ${values.last_name}`.trim(),
        faculty_institute: values.faculty_institute,
        school: values.school,
        position: values.position,
        keywords: keywords,
        google_scholar_link: values.google_scholar_link || '',
        bio: values.bio || ''
      };

      console.log('Sending user data to API:', userData);

      try {
        const registerData = await registerUserAPI(userData);
        console.log('Registration successful');

        if (registerData.token) {
          localStorage.setItem('authToken', registerData.token);

          const profileData = {
            full_name: userData.full_name,
            faculty_institute: userData.faculty_institute,
            school: userData.school,
            position: userData.position,
            keywords: keywords,
            google_scholar_link: userData.google_scholar_link,
            is_profile_completed: true
          };

          await updateProfileAfterRegisterAPI(registerData.token, profileData);
          console.log('Profile update successful');
          
          setSuccess(true);
          setTimeout(() => {
            router.push('/profile');
          }, 1500);
        } else {
          console.log('No token received, redirecting to dashboard');
          setSuccess(true);
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } catch (registrationError: any) {
        // Handle field-specific errors
        if (typeof registrationError === 'object' && registrationError.username) {
          setUsernameError(Array.isArray(registrationError.username) 
            ? registrationError.username[0] 
            : registrationError.username);
        }
        if (typeof registrationError === 'object' && registrationError.email) {
          setEmailError(Array.isArray(registrationError.email) 
            ? registrationError.email[0] 
            : registrationError.email);
        }

        // Handle general errors
        if (registrationError instanceof Error) {
          if (!registrationError.message.includes('username') && !registrationError.message.includes('email')) {
            setError(registrationError.message);
          }
        } else if (typeof registrationError === 'object') {
          const otherErrors = Object.entries(registrationError)
            .filter(([field]) => field !== 'username' && field !== 'email')
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');

          if (otherErrors) {
            setError(`Registration failed: ${otherErrors}`);
          }
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResearchAreaChange = (checkedValues: string[]) => {
    setSelectedResearchAreas(checkedValues);
  };

  if (isTokenFlow) {
    return (
      <Content style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '48px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Card style={{ width: '100%', maxWidth: 600, padding: '32px 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
              {isNewUser ? 'Complete Your Profile' : 'Update Your Profile'}
            </Title>

            {provider && (
              <Alert
                message={`Successfully signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
                type="success"
                style={{ marginBottom: 24 }}
                showIcon
              />
            )}

            {error && (
              <Alert
                message="Update Error"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: 24 }}
                closable
                onClose={() => setError('')}
              />
            )}

            {success && (
              <Alert
                message="Profile updated successfully! Redirecting..."
                type="success"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileSubmit}
              size="large"
            >
              <Form.Item
                label="Full Name"
                name="full_name"
                rules={[{ required: true, message: 'Please input your full name!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="John Doe" />
              </Form.Item>

              <Form.Item
                label="Faculty/Institute"
                name="faculty_institute"
                rules={[{ required: true, message: 'Please input your faculty/institute!' }]}
              >
                <Input prefix={<BankOutlined />} placeholder="Computer Science Faculty" />
              </Form.Item>

              <Form.Item
                label="School"
                name="school"
                rules={[{ required: true, message: 'Please input your school!' }]}
              >
                <Input prefix={<BookOutlined />} placeholder="University Name" />
              </Form.Item>

              <Form.Item
                label="Position"
                name="position"
                rules={[{ required: true, message: 'Please input your position!' }]}
              >
                <Input prefix={<TeamOutlined />} placeholder="Professor, PhD Student, etc." />
              </Form.Item>

              <Form.Item
                label="Keywords"
                name="keywords"
                rules={[{ required: true, message: 'Please input your research keywords!' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Enter keywords separated by commas"
                />
              </Form.Item>

              <Form.Item
                label="Google Scholar Link (Optional)"
                name="google_scholar_link"
              >
                <Input
                  prefix={<LinkOutlined />}
                  placeholder="https://scholar.google.com/citations?user=..."
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 32 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  style={{ width: '100%', height: 48 }}
                >
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </Content>
    );
  }

  return (
    <Content style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Card style={{ width: '100%', maxWidth: 800, padding: '32px 24px' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
            Create an Account
          </Title>

          {error && (
            <Alert
              message="Registration Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
              closable
              onClose={() => setError('')}
            />
          )}

          {success && (
            <Alert
              message="Registration successful! Redirecting..."
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleDirectSignup}
            size="large"
          >
            <Title level={4} style={{ marginBottom: 16 }}>
              <UserOutlined style={{ marginRight: 8 }} />
              Account Information
            </Title>
            
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Username"
                  name="username"
                  validateStatus={usernameError ? 'error' : ''}
                  help={usernameError}
                  rules={[{ required: true, message: 'Please input your username!' }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="john_doe"
                    onChange={() => setUsernameError('')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  validateStatus={emailError ? 'error' : ''}
                  help={emailError}
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="john@example.com"
                    onChange={() => setEmailError('')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Please input your password!' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Confirm Password"
                  name="password2"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm your password!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={4} style={{ marginBottom: 16 }}>
              <TeamOutlined style={{ marginRight: 8 }} />
              Personal Information
            </Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="First Name"
                  name="first_name"
                  rules={[{ required: true, message: 'Please input your first name!' }]}
                >
                  <Input placeholder="John" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Last Name"
                  name="last_name"
                  rules={[{ required: true, message: 'Please input your last name!' }]}
                >
                  <Input placeholder="Doe" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="School"
                  name="school"
                  rules={[{ required: true, message: 'Please input your school!' }]}
                >
                  <Input prefix={<BookOutlined />} placeholder="University Name" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Faculty/Institute"
                  name="faculty_institute"
                  rules={[{ required: true, message: 'Please input your faculty/institute!' }]}
                >
                  <Input prefix={<BankOutlined />} placeholder="Computer Science Faculty" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Position/Title"
                  name="position"
                  rules={[{ required: true, message: 'Please input your position!' }]}
                >
                  <Input prefix={<TeamOutlined />} placeholder="Professor, PhD Student, etc." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Google Scholar Link (optional)"
                  name="google_scholar_link"
                >
                  <Input
                    prefix={<LinkOutlined />}
                    placeholder="https://scholar.google.com/citations?user=..."
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={4} style={{ marginBottom: 16 }}>
              <ExperimentOutlined style={{ marginRight: 8 }} />
              Research Interests
            </Title>

            <Form.Item label="Select Research Areas (choose all that apply)">
              <div style={{ 
                maxHeight: 200, 
                overflowY: 'auto', 
                border: '1px solid #d9d9d9', 
                borderRadius: 6, 
                padding: 16
              }}>
                 <Row gutter={[8, 8]}>
                   {RESEARCH_AREAS.map(area => (
                     <Col xs={24} sm={12} md={8} key={area}>
                       <Checkbox
                         checked={selectedResearchAreas.includes(area)}
                         onChange={(e) => {
                           if (e.target.checked) {
                             setSelectedResearchAreas([...selectedResearchAreas, area]);
                           } else {
                             setSelectedResearchAreas(selectedResearchAreas.filter(item => item !== area));
                           }
                         }}
                       >
                         {area}
                       </Checkbox>
                     </Col>
                   ))}
                 </Row>
               </div>
            </Form.Item>

            <Form.Item
              label="Additional Keywords"
              name="custom_keywords"
            >
              <TextArea
                rows={2}
                placeholder="Enter additional keywords separated by commas"
              />
            </Form.Item>

            <Form.Item
              label="Bio (optional)"
              name="bio"
            >
              <TextArea
                rows={3}
                placeholder="Tell us about yourself"
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 32 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                style={{ width: '100%', height: 48 }}
              >
                {isLoading ? 'Processing...' : 'Sign Up'}
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '32px 0' }}>
            <Text type="secondary">OR</Text>
          </Divider>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Text type="secondary">
              You can also sign up with Google or Microsoft from the login page.
            </Text>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Already have an account?{' '}
              <Link href="/login">
                <Button type="link" style={{ padding: 0 }}>
                  Sign in
                </Button>
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </Content>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={
      <Content style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Spin size="large" />
        </div>
      </Content>
    }>
      <SignupForm />
    </Suspense>
  );
}