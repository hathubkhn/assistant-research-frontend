"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";
import { Menu, Input, Avatar, Dropdown, Space } from "antd";
import {
  HomeOutlined,
  DashboardOutlined,
  FileTextOutlined,
  BookOutlined,
  TeamOutlined,
  DatabaseOutlined,
  RobotOutlined,
  HeartOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const { Search } = Input;

export default function Header() {
  const { user, loading, logout, checkAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/search?query=${encodeURIComponent(value)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleMyLibraryClick = () => {
    if (user) {
      router.push("/my-library");
    } else {
      if (loading) return;

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      if (token) {
        checkAuth().then(() => {
          if (user) {
            router.push("/my-library");
          } else {
            router.push("/login");
          }
        });
      } else {
        router.push("/login");
      }
    }
  };

  // User dropdown menu
  const userMenuItems: MenuProps["items"] = user
    ? [
        {
          key: "user-info",
          label: (
            <div className="px-2 py-1">
              <div className="font-medium">
                {user.profile?.full_name || user.username}
              </div>
              <div className="text-gray-400 text-xs truncate">{user.email}</div>
            </div>
          ),
          disabled: true,
        },
        { type: "divider" },
        {
          key: "profile",
          icon: <UserOutlined />,
          label: "View Profile",
          onClick: () => router.push("/profile"),
        },
        {
          key: "logout",
          icon: <LogoutOutlined />,
          label: "Sign out",
          onClick: handleLogout,
        },
      ]
    : [
        {
          key: "profile",
          icon: <UserOutlined />,
          label: "View Profile",
          onClick: () => router.push("/profile"),
        },
        {
          key: "login",
          icon: <LoginOutlined />,
          label: "Sign in",
          onClick: () => router.push("/login"),
        },
      ];

  // Get current path for menu selection
  const getCurrentKey = () => {
    if (pathname === "/") return "home";
    if (pathname?.startsWith("/dashboard")) return "dashboard";
    if (pathname?.startsWith("/papers")) return "papers";
    if (pathname?.startsWith("/journals")) return "journals";
    if (pathname?.startsWith("/conferences")) return "conferences";
    if (pathname?.startsWith("/datasets")) return "datasets";
    if (pathname?.startsWith("/research-assistant"))
      return "research-assistant";
    if (pathname?.startsWith("/my-library")) return "my-library";
    return "";
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: <Link href="/">Home</Link>,
    },
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    {
      key: "papers",
      icon: <FileTextOutlined />,
      label: <Link href="/papers">Papers</Link>,
    },
    {
      key: "journals",
      icon: <BookOutlined />,
      label: <Link href="/journals">Journals</Link>,
    },
    {
      key: "conferences",
      icon: <TeamOutlined />,
      label: <Link href="/conferences">Conferences</Link>,
    },
    {
      key: "datasets",
      icon: <DatabaseOutlined />,
      label: <Link href="/datasets">Datasets</Link>,
    },
    {
      key: "research-assistant",
      icon: <RobotOutlined />,
      label: <Link href="/research-assistant">Research Assistant</Link>,
    },
    {
      key: "my-library",
      icon: <HeartOutlined />,
      label: (
        <a
          onClick={(e) => {
            e.preventDefault();
            handleMyLibraryClick();
          }}
        >
          My Library
        </a>
      ),
    },
  ];

  return (
    <header className="bg-[#1e40af] shadow-md" suppressHydrationWarning={true}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-white py-4">
            Research Assistant
          </Link>

          {/* Navigation Menu */}
          <Menu
            mode="horizontal"
            selectedKeys={[getCurrentKey()]}
            items={menuItems}
            style={{
              backgroundColor: "transparent",
              borderBottom: "none",
              color: "white",
              flex: 1,
              justifyContent: "center",
              fontSize: "14px",
            }}
            theme="dark"
            className="custom-menu"
          />

          {/* Right side - Search and User */}
          <Space size="middle" suppressHydrationWarning={true}>
            {/* Search */}
            <Search
              placeholder="Search..."
              onSearch={handleSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 200 }}
              className="header-search"
            />

            {/* Notifications and User */}
            {loading ? (
              <Avatar
                style={{ backgroundColor: "#87d068" }}
                icon={<UserOutlined />}
              />
            ) : user ? (
              <Space size="middle">
                <NotificationBell />
                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="bottomRight"
                  arrow
                >
                  <div style={{ cursor: "pointer" }}>
                    {user.profile?.avatar_url ? (
                      <Avatar src={user.profile.avatar_url} size="default" />
                    ) : (
                      <Avatar style={{ backgroundColor: "#1890ff" }}>
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                  </div>
                </Dropdown>
              </Space>
            ) : (
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                arrow
              >
                <Avatar
                  style={{ backgroundColor: "#87d068", cursor: "pointer" }}
                  icon={<UserOutlined />}
                />
              </Dropdown>
            )}
          </Space>
        </div>
      </div>

      <style jsx global>{`
        .custom-menu .ant-menu-item,
        .custom-menu .ant-menu-submenu {
          color: rgba(255, 255, 255, 0.85) !important;
        }
        .custom-menu .ant-menu-item:hover,
        .custom-menu .ant-menu-submenu:hover {
          color: white !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .custom-menu .ant-menu-item-selected {
          color: white !important;
          background-color: rgba(255, 255, 255, 0.15) !important;
        }
        .custom-menu .ant-menu-item-selected::after {
          border-bottom-color: white !important;
        }
        .custom-menu .ant-menu-item a,
        .custom-menu .ant-menu-submenu a {
          color: inherit !important;
        }
        .header-search .ant-input-group-wrapper {
          vertical-align: middle;
        }
        .header-search .ant-input {
          background-color: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          color: white;
        }
        .header-search .ant-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        .header-search .ant-input:focus,
        .header-search .ant-input:hover {
          background-color: rgba(255, 255, 255, 0.3);
          border-color: white;
        }
        .header-search .ant-input-search-button {
          background-color: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          color: white;
        }
        .header-search .ant-input-search-button:hover {
          background-color: rgba(255, 255, 255, 0.3);
          border-color: white;
        }
      `}</style>
    </header>
  );
}
