'use client';

import { useTranslation } from '@/utils/useTranslation';
import { LogoutOutlined, ProfileOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Menu, Space } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './NotificationBell';

const { Header: AntHeader } = Layout;

export default function Header() {
  const { user, loading, logout, checkAuth } = useAuth();
  const { t } = useTranslation('common');
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target as Node)) {
        setLoginDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef, loginDropdownRef]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleMyLibraryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("My Library clicked, auth status:", {
      userExists: !!user,
      userData: user,
      authToken: localStorage.getItem('authToken'),
      loading
    });

    if (user) {
      router.push('/my-library');
    } else {
      if (loading) {
        console.log("Auth still loading, please wait...");
        return;
      }

      const token = localStorage.getItem('authToken');
      if (token) {
        console.log("Token exists but user data is missing, forcing recheck");
        checkAuth().then(() => {
          if (user) {
            router.push('/my-library');
          } else {
            router.push('/login');
          }
        });
      } else {
        console.log("No token found, redirecting to login");
        router.push('/login');
      }
    }
  };

  const menuItems = [
    { key: '/dashboard', label: <Link href="/dashboard">{t('header.dashboard')}</Link> },
    { key: '/papers', label: <Link href="/papers">{t('header.papers')}</Link> },
    { key: '/journals', label: <Link href="/journals">{t('header.journals')}</Link> },
    { key: '/conferences', label: <Link href="/conferences">{t('header.conferences')}</Link> },
    { key: '/datasets', label: <Link href="/datasets">{t('header.datasets')}</Link> },
    { key: '/research-assistant', label: <Link href="/research-assistant">{t('header.researchAssistant')}</Link> },
    { key: '/ai-scientist', label: <Link href="/ai-scientist">{t('header.aiScientist')}</Link> },
    {
      key: 'my-library',
      label: <a href="#" onClick={handleMyLibraryClick}>{t('header.myLibrary')}</a>
    },
  ];

  return (
    <AntHeader style={{
      backgroundColor: '#d9363e',
      padding: '0 24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%'
      }} suppressHydrationWarning={true}>
        <Link href="/" style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none'
        }}>
          Research Assistant
        </Link>

        <Menu
          mode="horizontal"
          items={menuItems}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            flex: 1,
            justifyContent: 'center',
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}
          theme="dark"
          overflowedIndicator={null}
        />
        <Space size="middle" align="center">
          {user !== null ? (
            <>
              <NotificationBell />
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'user-info',
                      label: (
                        <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ fontWeight: 500 }}>{user.profile?.full_name || user.username}</div>
                          <div style={{ color: '#999', fontSize: '12px' }}>{user.email}</div>
                        </div>
                      ),
                      disabled: true
                    },
                    {
                      key: 'profile',
                      label: <Link href="/profile">{t('header.viewProfile')}</Link>,
                      icon: <ProfileOutlined />
                    },
                    {
                      key: 'logout',
                      label: t('header.signOut'),
                      icon: <LogoutOutlined />,
                      onClick: handleLogout
                    }
                  ]
                }}
                trigger={['click']}
                open={dropdownOpen}
                onOpenChange={setDropdownOpen}
              >
                <div ref={dropdownRef} suppressHydrationWarning={true}>
                  <Avatar
                    size="default"
                    src={user.profile?.avatar_url}
                    style={{
                      cursor: 'pointer',
                      border: '2px solid white'
                    }}
                  >
                    {!user.profile?.avatar_url && user.username.charAt(0).toUpperCase()}
                  </Avatar>
                </div>
              </Dropdown>
            </>
          ) : (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'login',
                    label: (
                      <div onClick={() => {
                        console.log('Login clicked');
                        router.push('/login');
                      }}>
                        <UserOutlined style={{ marginRight: 8 }} />
                        {t('auth.login')}
                      </div>
                    )
                  }
                ]
              }}
              trigger={['click']}
              open={loginDropdownOpen}
              onOpenChange={setLoginDropdownOpen}
            >
              <Button
                type="text"
                icon={<UserOutlined />}
                style={{
                  color: 'white',
                  border: 'none'
                }}
                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
              />
            </Dropdown>
          )}
          <LanguageSwitcher />
        </Space>
      </div>
    </AntHeader>
  );
} 