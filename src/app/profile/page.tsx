'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchWithAuth, fetchProfile, hasAuthToken } from '@/utils/auth';
import { useTranslation } from '@/utils/useTranslation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Publication {
  id: number;
  title: string;
  authors: string;
  journal: string;
  year: number;
  url: string;
}

interface ProfileData {
  username: string;
  email: string;
  full_name: string;
  position: string;
  faculty_institute: string;
  school: string;
  avatar_url: string;
  google_scholar_link: string;
  keywords: string;
  additional_keywords: string;
  bio: string;
  publications: Publication[];
}

export default function Profile() {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<ProfileData>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Publication management states
  const [publications, setPublications] = useState<Publication[]>([]);
  const [newPublication, setNewPublication] = useState<Partial<Publication>>({
    title: '',
    authors: '',
    journal: '',
    year: new Date().getFullYear(),
    url: '',
  });
  const [editingPublication, setEditingPublication] =
    useState<Publication | null>(null);
  const [publicationLoading, setPublicationLoading] = useState(false);
  const [publicationError, setPublicationError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        if (!hasAuthToken()) {
          console.log('No auth token found, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('Fetching profile data...');
        const profileData = await fetchProfile();

        if (profileData) {
          console.log('Profile data received:', profileData);
          setProfile(profileData);
          setEditedProfile(profileData);
          setPublications(profileData.publications || []);
        } else {
          console.error('Failed to load profile - no data returned');
          setError('Failed to load profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile || {});
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setError('');
    try {
      if (!hasAuthToken()) {
        router.push('/login');
        return;
      }

      const response = await fetchWithAuth(`${API_URL}/api/profile/update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: editedProfile.full_name,
          position: editedProfile.position,
          faculty_institute: editedProfile.faculty_institute,
          school: editedProfile.school,
          google_scholar_link: editedProfile.google_scholar_link,
          research_interests: editedProfile.keywords,
          additional_keywords: editedProfile.additional_keywords,
          bio: editedProfile.bio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('avatar', selectedFile);

          const avatarResponse = await fetchWithAuth(
            `${API_URL}/api/profile/avatar/`,
            {
              method: 'POST',
              body: formData,
            },
          );

          if (!avatarResponse.ok) {
            const errorData = await avatarResponse.json();
            throw new Error(errorData.detail || 'Failed to upload avatar');
          }
        } catch (avatarError) {
          console.error('Avatar upload error:', avatarError);
          setError(
            `Profile updated but avatar upload failed: ${avatarError instanceof Error ? avatarError.message : String(avatarError)}`,
          );
        }
      }

      const profileData = await fetchProfile();

      if (profileData) {
        setProfile(profileData);
        setSaveSuccess(true);
        setTimeout(() => {
          setIsEditing(false);
          setSaveSuccess(false);
        }, 2000);
      } else {
        console.warn('Failed to refresh profile after update');
        setSaveSuccess(true);
        setTimeout(() => {
          setIsEditing(false);
          setSaveSuccess(false);
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddPublication = async () => {
    setPublicationLoading(true);
    setPublicationError('');

    try {
      if (!hasAuthToken()) {
        router.push('/login');
        return;
      }

      if (
        !newPublication.title ||
        !newPublication.authors ||
        !newPublication.journal ||
        !newPublication.year ||
        !newPublication.url
      ) {
        setPublicationError('All fields are required');
        setPublicationLoading(false);
        return;
      }

      const response = await fetchWithAuth(`${API_URL}/api/publications/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPublication),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to add publication');
        } else {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`,
          );
        }
      }

      const createdPublication = await response.json();

      setPublications((prevPublications) => [
        ...prevPublications,
        createdPublication,
      ]);

      if (profile) {
        const updatedPublications = [
          ...(profile.publications || []),
          createdPublication,
        ];
        setProfile({
          ...profile,
          publications: updatedPublications,
        });
      }

      // Reset form
      setNewPublication({
        title: '',
        authors: '',
        journal: '',
        year: new Date().getFullYear(),
        url: '',
      });
    } catch (err) {
      console.error('Error adding publication:', err);
      setPublicationError(
        err instanceof Error ? err.message : 'Failed to add publication',
      );
    } finally {
      setPublicationLoading(false);
    }
  };

  // Update an existing publication
  const handleUpdatePublication = async () => {
    if (!editingPublication) return;

    setPublicationLoading(true);
    setPublicationError('');

    try {
      if (!hasAuthToken()) {
        router.push('/login');
        return;
      }

      const response = await fetchWithAuth(
        `${API_URL}/api/publications/${editingPublication.id}/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editingPublication),
        },
      );

      if (!response.ok) {
        // Check content type to avoid parsing HTML as JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to update publication');
        } else {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`,
          );
        }
      }

      const updatedPublication = await response.json();

      // Update in publications state
      setPublications((prevPublications) =>
        prevPublications.map((pub) =>
          pub.id === updatedPublication.id ? updatedPublication : pub,
        ),
      );

      // Update in profile state
      if (profile && profile.publications) {
        setProfile({
          ...profile,
          publications: profile.publications.map((pub) =>
            pub.id === updatedPublication.id ? updatedPublication : pub,
          ),
        });
      }

      setEditingPublication(null);
    } catch (err) {
      console.error('Error updating publication:', err);
      setPublicationError(
        err instanceof Error ? err.message : 'Failed to update publication',
      );
    } finally {
      setPublicationLoading(false);
    }
  };

  // Delete a publication
  const handleDeletePublication = async (id: number) => {
    if (!confirm('Are you sure you want to delete this publication?')) return;

    setPublicationLoading(true);
    setPublicationError('');

    try {
      if (!hasAuthToken()) {
        router.push('/login');
        return;
      }

      const response = await fetchWithAuth(
        `${API_URL}/api/publications/${id}/`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        // Check content type to avoid parsing HTML as JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete publication');
        } else {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`,
          );
        }
      }

      // Update publications state
      setPublications((prevPublications) =>
        prevPublications.filter((pub) => pub.id !== id),
      );

      // Update profile state
      if (profile && profile.publications) {
        setProfile({
          ...profile,
          publications: profile.publications.filter((pub) => pub.id !== id),
        });
      }
    } catch (err) {
      console.error('Error deleting publication:', err);
      setPublicationError(
        err instanceof Error ? err.message : 'Failed to delete publication',
      );
    } finally {
      setPublicationLoading(false);
    }
  };

  // Publication form change handler
  const handlePublicationChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (editingPublication) {
      setEditingPublication({
        ...editingPublication,
        [name]: name === 'year' ? parseInt(value) : value,
      });
    } else {
      setNewPublication({
        ...newPublication,
        [name]: name === 'year' ? parseInt(value) : value,
      });
    }
  };

  useEffect(() => {
    if (profile && profile.publications) {
      setPublications(profile.publications);
    }
  }, [profile]);

  // Return loading state
  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto bg-white rounded-lg shadow p-8'>
          <div className='animate-pulse'>
            <div className='h-32 bg-gray-200 rounded-lg mb-4'></div>
            <div className='h-8 bg-gray-200 rounded w-1/3 mb-4'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2 mb-2'></div>
            <div className='h-4 bg-gray-200 rounded w-1/4 mb-2'></div>
            <div className='h-24 bg-gray-200 rounded mb-4'></div>
          </div>
        </div>
      </div>
    );
  }

  // Return error state
  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto bg-white rounded-lg shadow p-8'>
          <div className='text-center'>
            <div className='text-red-500 text-xl mb-4'>
              Error Loading Profile
            </div>
            <p className='mb-4'>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='bg-white p-8 rounded-lg shadow-md max-w-md w-full'>
          <h2 className='text-xl font-semibold text-center mb-4'>
            Profile Not Found
          </h2>
          <p className='text-gray-600 text-center mb-6'>
            We couldn't find your profile information.
          </p>
          <div className='flex justify-center'>
            <button
              onClick={() => router.push('/dashboard')}
              className='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200'
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format keywords as tags
  const keywordTags = (profile.keywords || '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k);

  // View mode (not editing)
  if (!isEditing) {
    return (
      <div className='min-h-screen bg-gray-100 py-10'>
        <div className='container mx-auto px-4'>
          <div className='bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto'>
            {/* Profile header with cover background */}
            <div className='h-40 bg-gradient-to-r from-hust-red to-hust-red-light'></div>

            {/* Profile content */}
            <div className='px-6 py-8'>
              <div className='flex flex-col md:flex-row'>
                {/* Avatar section */}
                <div className='md:w-1/3 flex flex-col items-center'>
                  <div className='relative -mt-20 mb-6'>
                    <div className='w-32 h-32 bg-white rounded-full p-1 shadow-lg'>
                      {profile.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.full_name || 'Profile'}
                          width={128}
                          height={128}
                          className='rounded-full object-cover w-full h-full'
                        />
                      ) : (
                        <div className='w-full h-full rounded-full bg-gray-200 flex items-center justify-center'>
                          <span className='text-4xl text-gray-400'>
                            {profile.full_name
                              ? profile.full_name.charAt(0).toUpperCase()
                              : 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <h1 className='text-2xl font-bold text-center mb-1'>
                    {profile.full_name}
                  </h1>
                  <p className='text-gray-600 mb-4 text-center'>
                    {profile.position}
                  </p>
                  <p className='text-gray-600 mb-4 text-center'>
                    {profile.faculty_institute}
                  </p>
                  <p className='text-gray-600 mb-4 text-center'>
                    {profile.school}
                  </p>

                  {profile.google_scholar_link && (
                    <a
                      href={profile.google_scholar_link}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-red-500 hover:text-red-700 flex items-center mb-6'
                    >
                      <svg
                        className='w-5 h-5 mr-2'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                      >
                        <path d='M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z' />
                      </svg>
                      Google Scholar
                    </a>
                  )}

                  <button
                    onClick={handleEdit}
                    className='mt-2 px-4 py-2 bg-hust-red text-white rounded-md hover:bg-red-700 transition duration-200'
                  >
                    Edit Profile
                  </button>
                </div>

                {/* Main content section */}
                <div className='md:w-2/3 md:pl-8 mt-6 md:mt-0'>
                  {/* Research Interests */}
                  <section className='mb-8'>
                    <h2 className='text-xl font-semibold mb-4 text-gray-800'>
                      Research Interests
                    </h2>
                    <div className='flex flex-wrap gap-2'>
                      {keywordTags.length > 0 ? (
                        keywordTags.map((tag, index) => (
                          <span
                            key={index}
                            className='px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm'
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <p className='text-gray-500 italic'>
                          No research interests specified.
                        </p>
                      )}
                    </div>
                  </section>

                  {/* Additional Keywords */}
                  {profile.additional_keywords && (
                    <section className='mb-8'>
                      <h2 className='text-xl font-semibold mb-4 text-gray-800'>
                        Additional Keywords
                      </h2>
                      <div className='flex flex-wrap gap-2'>
                        {profile.additional_keywords
                          .split(',')
                          .map((k) => k.trim())
                          .filter((k) => k).length > 0 ? (
                          profile.additional_keywords
                            .split(',')
                            .map((k) => k.trim())
                            .filter((k) => k)
                            .map((tag, index) => (
                              <span
                                key={index}
                                className='px-3 py-1 bg-red-50 text-red-800 rounded-full text-sm'
                              >
                                {tag}
                              </span>
                            ))
                        ) : (
                          <p className='text-gray-500 italic'>
                            No additional keywords specified.
                          </p>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Bio/About */}
                  <section className='mb-8'>
                    <h2 className='text-xl font-semibold mb-4 text-gray-800'>
                      About
                    </h2>
                    {profile.bio ? (
                      <p className='text-gray-700 whitespace-pre-line'>
                        {profile.bio}
                      </p>
                    ) : (
                      <p className='text-gray-500 italic'>No bio provided.</p>
                    )}
                  </section>

                  {/* Publications */}
                  <section>
                    <h2 className='text-xl font-semibold mb-4 text-gray-800'>
                      Publications
                    </h2>
                    {profile.publications && profile.publications.length > 0 ? (
                      <ul className='space-y-4'>
                        {profile.publications.map((pub) => (
                          <li
                            key={pub.id}
                            className='border-l-4 border-hust-red pl-4 py-1'
                          >
                            <a
                              href={pub.url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='font-medium text-red-700 hover:text-red-900'
                            >
                              {pub.title}
                            </a>
                            <p className='text-gray-600 text-sm mt-1'>
                              {pub.authors}
                            </p>
                            <p className='text-gray-500 text-sm'>
                              {pub.journal}, {pub.year}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className='text-gray-500 italic'>
                        No publications listed.
                      </p>
                    )}
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className='min-h-screen bg-gray-100 py-10'>
      <div className='container mx-auto px-4'>
        <div className='bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto'>
          <div className='px-6 py-8'>
            <h1 className='text-2xl font-bold mb-6 text-center'>
              Edit Profile
            </h1>

            {saveSuccess && (
              <div className='mb-6 p-3 bg-green-100 text-green-700 rounded-md text-center'>
                Profile updated successfully!
              </div>
            )}

            {error && (
              <div className='mb-6 p-3 bg-red-100 text-red-700 rounded-md text-center'>
                {error}
              </div>
            )}

            <div className='flex flex-col md:flex-row gap-8'>
              {/* Avatar upload section */}
              <div className='md:w-1/3'>
                <div className='flex flex-col items-center'>
                  <div className='w-32 h-32 mb-4 relative'>
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt='Preview'
                        width={128}
                        height={128}
                        className='rounded-full object-cover w-full h-full'
                      />
                    ) : profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.full_name || 'Profile'}
                        width={128}
                        height={128}
                        className='rounded-full object-cover w-full h-full'
                      />
                    ) : (
                      <div className='w-full h-full rounded-full bg-gray-200 flex items-center justify-center'>
                        <span className='text-4xl text-gray-400'>
                          {profile.full_name
                            ? profile.full_name.charAt(0).toUpperCase()
                            : 'U'}
                        </span>
                      </div>
                    )}
                  </div>

                  <label className='block mb-6'>
                    <span className='sr-only'>Choose profile photo</span>
                    <input
                      type='file'
                      className='block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-red-50 file:text-red-700
                                                hover:file:bg-red-100'
                      accept='image/*'
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              {/* Form section */}
              <div className='md:w-2/3 space-y-4'>
                <div>
                  <label
                    htmlFor='full_name'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Full Name
                  </label>
                  <input
                    type='text'
                    id='full_name'
                    name='full_name'
                    value={editedProfile.full_name || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500'
                  />
                </div>

                <div>
                  <label
                    htmlFor='position'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Position
                  </label>
                  <input
                    type='text'
                    id='position'
                    name='position'
                    value={editedProfile.position || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500'
                  />
                </div>

                <div>
                  <label
                    htmlFor='faculty_institute'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Faculty/Institute
                  </label>
                  <input
                    type='text'
                    id='faculty_institute'
                    name='faculty_institute'
                    value={editedProfile.faculty_institute || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500'
                  />
                </div>

                <div>
                  <label
                    htmlFor='school'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    School
                  </label>
                  <input
                    type='text'
                    id='school'
                    name='school'
                    value={editedProfile.school || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500'
                  />
                </div>

                <div>
                  <label
                    htmlFor='google_scholar_link'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Google Scholar Link
                  </label>
                  <input
                    type='url'
                    id='google_scholar_link'
                    name='google_scholar_link'
                    value={editedProfile.google_scholar_link || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500'
                    placeholder='https://scholar.google.com/citations?user=...'
                  />
                </div>

                <div>
                  <label
                    htmlFor='keywords'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Research Keywords
                  </label>
                  <input
                    type='text'
                    id='keywords'
                    name='keywords'
                    value={editedProfile.keywords || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500'
                    placeholder='AI, Machine Learning, Data Science, etc. (comma separated)'
                  />
                </div>

                <div>
                  <label
                    htmlFor='additional_keywords'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Additional Keywords
                  </label>
                  <input
                    type='text'
                    id='additional_keywords'
                    name='additional_keywords'
                    value={editedProfile.additional_keywords || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500'
                    placeholder='Enter additional keywords separated by commas'
                  />
                </div>

                <div>
                  <label
                    htmlFor='bio'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Bio
                  </label>
                  <textarea
                    id='bio'
                    name='bio'
                    rows={4}
                    value={editedProfile.bio || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500'
                    placeholder='Tell us about yourself and your research...'
                  ></textarea>
                </div>

                {/* Publications section */}
                <div className='mt-8'>
                  <h3 className='text-lg font-semibold mb-4'>Publications</h3>

                  {publicationError && (
                    <div className='mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm'>
                      {publicationError}
                    </div>
                  )}

                  {/* Publication list */}
                  {publications.length > 0 ? (
                    <div className='mb-6 space-y-4'>
                      {publications.map((pub) => (
                        <div
                          key={pub.id}
                          className='border p-3 rounded-md relative'
                        >
                          <h4 className='font-medium'>{pub.title}</h4>
                          <p className='text-sm text-gray-600'>{pub.authors}</p>
                          <p className='text-sm text-gray-500'>
                            {pub.journal}, {pub.year}
                          </p>
                          <div className='mt-2 flex space-x-2'>
                            <button
                              onClick={() => setEditingPublication(pub)}
                              className='text-sm text-red-600 hover:text-red-800'
                              disabled={publicationLoading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePublication(pub.id)}
                              className='text-sm text-red-600 hover:text-red-800'
                              disabled={publicationLoading}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-gray-500 italic mb-4'>
                      No publications added yet.
                    </p>
                  )}

                  {/* Publication form */}
                  <div className='border p-4 rounded-md bg-gray-50'>
                    <h4 className='font-medium mb-3'>
                      {editingPublication
                        ? 'Edit Publication'
                        : 'Add New Publication'}
                    </h4>

                    <div className='space-y-3'>
                      <div>
                        <label
                          htmlFor='title'
                          className='block text-sm font-medium text-gray-700 mb-1'
                        >
                          Title *
                        </label>
                        <input
                          type='text'
                          id='title'
                          name='title'
                          value={
                            editingPublication
                              ? editingPublication.title
                              : newPublication.title
                          }
                          onChange={handlePublicationChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm'
                          placeholder='Publication title'
                        />
                      </div>

                      <div>
                        <label
                          htmlFor='authors'
                          className='block text-sm font-medium text-gray-700 mb-1'
                        >
                          Authors *
                        </label>
                        <input
                          type='text'
                          id='authors'
                          name='authors'
                          value={
                            editingPublication
                              ? editingPublication.authors
                              : newPublication.authors
                          }
                          onChange={handlePublicationChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm'
                          placeholder='Author 1, Author 2, etc.'
                        />
                      </div>

                      <div>
                        <label
                          htmlFor='journal'
                          className='block text-sm font-medium text-gray-700 mb-1'
                        >
                          Journal/Conference *
                        </label>
                        <input
                          type='text'
                          id='journal'
                          name='journal'
                          value={
                            editingPublication
                              ? editingPublication.journal
                              : newPublication.journal
                          }
                          onChange={handlePublicationChange}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm'
                          placeholder='Journal or conference name'
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label
                            htmlFor='year'
                            className='block text-sm font-medium text-gray-700 mb-1'
                          >
                            Year *
                          </label>
                          <input
                            type='number'
                            id='year'
                            name='year'
                            value={
                              editingPublication
                                ? editingPublication.year
                                : newPublication.year
                            }
                            onChange={handlePublicationChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm'
                            min='1900'
                            max={new Date().getFullYear() + 1}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor='url'
                            className='block text-sm font-medium text-gray-700 mb-1'
                          >
                            URL *
                          </label>
                          <input
                            type='url'
                            id='url'
                            name='url'
                            value={
                              editingPublication
                                ? editingPublication.url
                                : newPublication.url
                            }
                            onChange={handlePublicationChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm'
                            placeholder='https://...'
                          />
                        </div>
                      </div>

                      <div className='flex justify-end space-x-2 mt-3'>
                        {editingPublication && (
                          <button
                            type='button'
                            onClick={() => setEditingPublication(null)}
                            className='px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm ml-2'
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          type='button'
                          onClick={
                            editingPublication
                              ? handleUpdatePublication
                              : handleAddPublication
                          }
                          className='px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm'
                          disabled={publicationLoading}
                        >
                          {publicationLoading
                            ? 'Saving...'
                            : editingPublication
                              ? 'Update'
                              : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-8 flex justify-end space-x-4'>
              <button
                type='button'
                onClick={handleCancel}
                className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition duration-200 ml-2'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleSave}
                disabled={saveLoading}
                className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 disabled:opacity-50'
              >
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
