'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '../../utils/useTranslation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log('API URL:', API_URL);

// Research areas for dropdown selection
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

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useTranslation('signup');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');

    // Get token from URL params
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const isNewUser = searchParams.get('is_new') === 'True';

    // State for direct signup
    const [isTokenFlow, setIsTokenFlow] = useState(false);
    const [directSignupData, setDirectSignupData] = useState({
        username: '',
        email: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
        full_name: '',
        faculty_institute: '',
        school: '',
        position: '',
        research_interests: [],
        custom_keywords: '',
        google_scholar_link: '',
        bio: ''
    });

    const [formData, setFormData] = useState({
        full_name: '',
        faculty_institute: '',
        school: '',
        keywords: '',
        position: '',
        google_scholar_link: '',
    });

    const [selectedResearchAreas, setSelectedResearchAreas] = useState<string[]>([]);

    useEffect(() => {
        // If we have a token, it's the token-based flow
        if (token) {
            setIsTokenFlow(true);

            // Try to fetch the user's profile
            const fetchUserProfile = async () => {
                try {
                    const response = await fetch(`${API_URL}/api/profile/`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${token}`,
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Fill form with existing data if available
                        setFormData({
                            full_name: data.full_name || '',
                            faculty_institute: data.faculty_institute || '',
                            school: data.school || '',
                            keywords: data.keywords || '',
                            position: data.position || '',
                            google_scholar_link: data.google_scholar_link || '',
                        });

                        // If profile is already completed, redirect to dashboard
                        if (data.is_profile_completed) {
                            router.push('/dashboard');
                        }
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            };

            fetchUserProfile();
        }
    }, [token, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDirectSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Clear field-specific errors when the field changes
        if (name === 'username') {
            setUsernameError('');
        } else if (name === 'email') {
            setEmailError('');
        }

        setDirectSignupData(prev => {
            const updatedData = {
                ...prev,
                [name]: value
            };

            // Auto-generate full_name when first_name or last_name changes
            if (name === 'first_name' || name === 'last_name') {
                const firstName = name === 'first_name' ? value : prev.first_name;
                const lastName = name === 'last_name' ? value : prev.last_name;
                updatedData.full_name = `${firstName} ${lastName}`.trim();
            }

            return updatedData;
        });
    };

    const handleResearchAreaChange = (area: string) => {
        setSelectedResearchAreas(prev => {
            if (prev.includes(area)) {
                return prev.filter(item => item !== area);
            } else {
                return [...prev, area];
            }
        });
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/api/profile/update/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setSuccess(true);
                // Redirect to dashboard after successful signup
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to update profile');
            }
        } catch (error) {
            setError('An error occurred while updating your profile');
            console.error('Profile update error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDirectSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setUsernameError('');
        setEmailError('');

        console.log('Starting signup process');

        // Validate passwords match
        if (directSignupData.password !== directSignupData.password2) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        // Combine selected research areas with custom keywords
        const keywords = [
            ...selectedResearchAreas,
            ...(directSignupData.custom_keywords ? directSignupData.custom_keywords.split(',').map(k => k.trim()) : [])
        ].join(', ');

        console.log('User data:', {
            username: directSignupData.username,
            email: directSignupData.email,
            full_name: directSignupData.full_name,
            faculty_institute: directSignupData.faculty_institute,
            school: directSignupData.school,
            position: directSignupData.position,
            keywords: keywords
        });

        // Inside the handleDirectSignup function before making the API call
        const userData = {
            username: directSignupData.username,
            email: directSignupData.email,
            password: directSignupData.password,
            first_name: directSignupData.first_name,
            last_name: directSignupData.last_name,
            full_name: directSignupData.full_name,
            faculty_institute: directSignupData.faculty_institute,
            school: directSignupData.school,
            position: directSignupData.position,
            keywords: keywords,
            google_scholar_link: directSignupData.google_scholar_link,
            bio: directSignupData.bio
        };

        console.log('Sending user data to API:', userData);

        try {
            console.log('Making registration API call to:', `${API_URL}/api/register/`);
            // First register the user
            const registerResponse = await fetch(`${API_URL}/api/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            console.log('Register response status:', registerResponse.status);
            console.log('Register response status text:', registerResponse.statusText);

            if (registerResponse.ok) {
                const data = await registerResponse.json();
                console.log('Registration successful, response data:', data);

                // Store token
                if (data.token) {
                    localStorage.setItem('authToken', data.token);

                    // Now update the profile with additional information
                    console.log('Making profile update API call to:', `${API_URL}/api/profile/`);
                    const profileResponse = await fetch(`${API_URL}/api/profile/`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${data.token}`,
                        },
                        body: JSON.stringify({
                            full_name: directSignupData.full_name,
                            faculty_institute: directSignupData.faculty_institute,
                            school: directSignupData.school,
                            position: directSignupData.position,
                            keywords: keywords,
                            google_scholar_link: directSignupData.google_scholar_link,
                            is_profile_completed: true
                        }),
                    });

                    console.log('Profile update response status:', profileResponse.status);

                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        console.log('Profile update successful, response data:', profileData);
                        setSuccess(true);
                        // Redirect to profile page
                        setTimeout(() => {
                            router.push('/profile');
                        }, 1500);
                    } else {
                        const errorText = await profileResponse.text();
                        console.error('Profile update failed:', errorText);

                        try {
                            // Try to parse as JSON first
                            const errorData = JSON.parse(errorText);
                            console.error('Profile update error details:', errorData);

                            // Handle different error formats
                            if (errorData.detail) {
                                setError(errorData.detail);
                            } else if (typeof errorData === 'object') {
                                // Handle field-specific errors
                                const errorMessages = Object.entries(errorData)
                                    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                                    .join('; ');
                                setError(`Profile update failed: ${errorMessages}`);
                            } else {
                                setError('Failed to update profile');
                            }
                        } catch (parseError) {
                            // If not JSON, use the raw text
                            setError(`Profile update failed: ${errorText.substring(0, 100)}`);
                            console.error('Could not parse profile update error response:', parseError);
                        }
                    }
                } else {
                    console.log('No token received, redirecting to dashboard');
                    setSuccess(true);
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 1500);
                }
            } else {
                console.error('Registration failed');
                try {
                    // First try to get the response as text
                    const responseText = await registerResponse.text();
                    let errorData;

                    try {
                        // Try to parse the response as JSON
                        errorData = JSON.parse(responseText);
                        console.error('Registration error details:', errorData);

                        // Handle field-specific errors
                        if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
                            if (errorData.username) {
                                setUsernameError(Array.isArray(errorData.username) ? errorData.username[0] : errorData.username);
                            }
                            if (errorData.email) {
                                setEmailError(Array.isArray(errorData.email) ? errorData.email[0] : errorData.email);
                            }

                            // For other errors, show in the general error message
                            const otherErrors = Object.entries(errorData)
                                .filter(([field]) => field !== 'username' && field !== 'email')
                                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                                .join('; ');

                            if (otherErrors) {
                                setError(`Registration failed: ${otherErrors}`);
                            } else if (!errorData.username && !errorData.email) {
                                // If no specific field errors, show general error
                                setError('Registration failed. Please try again.');
                            }
                        } else if (errorData.detail) {
                            setError(errorData.detail);
                        } else {
                            setError('Registration failed. Please try again.');
                        }
                    } catch (jsonError) {
                        // If response is not valid JSON, show the raw text (truncated if too long)
                        console.error('Could not parse registration error response:', jsonError);
                        setError(`Registration failed: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
                    }
                } catch (error) {
                    // If we couldn't even get the response text
                    console.error('Failed to read registration error response:', error);
                    setError('Registration failed. Please try again later.');
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            if (error instanceof Error) {
                // Check for network errors
                if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    setError('Network error: Please check your internet connection and try again.');
                } else {
                    setError(`An error occurred during registration: ${error.message}`);
                }
            } else {
                setError('An error occurred during registration. Please try again later.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Render profile completion form (token-based flow)
    if (isTokenFlow) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4">
                <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
                        {isNewUser ? 'Complete Your Profile' : 'Update Your Profile'}
                    </h2>

                    {provider && (
                        <div className="mb-6 text-center text-sm text-gray-600">
                            Successfully signed in with {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                            Profile updated successfully! Redirecting...
                        </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                                Full Name *
                            </label>
                            <input
                                id="full_name"
                                name="full_name"
                                type="text"
                                required
                                value={formData.full_name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="faculty_institute" className="block text-sm font-medium text-gray-700">
                                Faculty/Institute *
                            </label>
                            <input
                                id="faculty_institute"
                                name="faculty_institute"
                                type="text"
                                required
                                value={formData.faculty_institute}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="school" className="block text-sm font-medium text-gray-700">
                                School *
                            </label>
                            <input
                                id="school"
                                name="school"
                                type="text"
                                required
                                value={formData.school}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                                Position *
                            </label>
                            <input
                                id="position"
                                name="position"
                                type="text"
                                required
                                value={formData.position}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
                                Keywords *
                            </label>
                            <textarea
                                id="keywords"
                                name="keywords"
                                required
                                value={formData.keywords}
                                onChange={handleChange}
                                rows={3}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter keywords separated by commas"
                            />
                        </div>

                        <div>
                            <label htmlFor="google_scholar_link" className="block text-sm font-medium text-gray-700">
                                Google Scholar Link (Optional)
                            </label>
                            <input
                                id="google_scholar_link"
                                name="google_scholar_link"
                                type="url"
                                value={formData.google_scholar_link}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="https://scholar.google.com/citations?user=..."
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isLoading ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Render direct signup form
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-8">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Create an Account</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                        Registration successful! Redirecting...
                    </div>
                )}

                <form onSubmit={handleDirectSignup} className="mb-6 space-y-4">
                    <div className="mb-6">
                        <h3 className="font-medium text-gray-700 mb-3">Account Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={directSignupData.username}
                                    onChange={handleDirectSignupChange}
                                    className={`w-full px-4 py-2 border ${usernameError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                                    required
                                />
                                {usernameError && (
                                    <p className="mt-1 text-sm text-red-600">{usernameError}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={directSignupData.email}
                                    onChange={handleDirectSignupChange}
                                    className={`w-full px-4 py-2 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                                    required
                                />
                                {emailError && (
                                    <p className="mt-1 text-sm text-red-600">{emailError}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={directSignupData.password}
                                    onChange={handleDirectSignupChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password *
                                </label>
                                <input
                                    type="password"
                                    id="password2"
                                    name="password2"
                                    value={directSignupData.password2}
                                    onChange={handleDirectSignupChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-medium text-gray-700 mb-3">Personal Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={directSignupData.first_name}
                                    onChange={handleDirectSignupChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={directSignupData.last_name}
                                    onChange={handleDirectSignupChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    id="full_name"
                                    name="full_name"
                                    value={directSignupData.full_name}
                                    onChange={handleDirectSignupChange}
                                    className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    readOnly
                                />
                                <p className="text-xs text-gray-500 mt-1">Auto-generated from your first and last name</p>
                            </div>
                            <div>
                                <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                                    School *
                                </label>
                                <input
                                    type="text"
                                    id="school"
                                    name="school"
                                    value={directSignupData.school}
                                    onChange={handleDirectSignupChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="faculty_institute" className="block text-sm font-medium text-gray-700 mb-1">
                                    Faculty/Institute *
                                </label>
                                <input
                                    type="text"
                                    id="faculty_institute"
                                    name="faculty_institute"
                                    value={directSignupData.faculty_institute}
                                    onChange={handleDirectSignupChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                                    Position/Title *
                                </label>
                                <input
                                    type="text"
                                    id="position"
                                    name="position"
                                    value={directSignupData.position}
                                    onChange={handleDirectSignupChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="google_scholar_link" className="block text-sm font-medium text-gray-700 mb-1">
                                    Google Scholar Link (optional)
                                </label>
                                <input
                                    type="url"
                                    id="google_scholar_link"
                                    name="google_scholar_link"
                                    value={directSignupData.google_scholar_link}
                                    onChange={handleDirectSignupChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://scholar.google.com/citations?user=..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-medium text-gray-700 mb-3">Research Interests</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Research Areas (choose all that apply):
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                                {RESEARCH_AREAS.map(area => (
                                    <div key={area} className="flex items-start">
                                        <input
                                            type="checkbox"
                                            id={`area-${area}`}
                                            checked={selectedResearchAreas.includes(area)}
                                            onChange={() => handleResearchAreaChange(area)}
                                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                        />
                                        <label htmlFor={`area-${area}`} className="ml-2 text-sm text-gray-700">
                                            {area}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="custom_keywords" className="block text-sm font-medium text-gray-700 mb-1">
                                Additional Keywords
                            </label>
                            <textarea
                                id="custom_keywords"
                                name="custom_keywords"
                                value={directSignupData.custom_keywords}
                                onChange={handleDirectSignupChange}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter additional keywords separated by commas"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-medium text-gray-700 mb-3">Bio</h3>
                        <textarea
                            name="bio"
                            value={directSignupData.bio}
                            onChange={handleDirectSignupChange}
                            rows={3}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            placeholder="Tell us about yourself (optional)"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                    >
                        {isLoading ? 'Processing...' : 'Sign Up'}
                    </button>
                </form>

                <div className="relative flex items-center justify-center mt-6 mb-6">
                    <div className="border-t border-gray-300 absolute w-full"></div>
                    <div className="bg-white px-4 relative text-sm text-gray-500">OR</div>
                </div>

                <div className="mb-6 text-center text-sm text-gray-600">
                    You can also sign up with Google or Microsoft from the login page.
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        {"Already have an account? "}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function Signup() {
    return (
        <Suspense fallback={<div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">Loading...</div>}>
            <SignupForm />
        </Suspense>
    );
}