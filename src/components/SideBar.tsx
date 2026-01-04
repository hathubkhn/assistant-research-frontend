"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  Tooltip,
  Modal,
  Input,
  Dropdown,
  Popconfirm,
  Button,
  MenuProps
} from "antd";
import { MoreOutlined, DeleteOutlined } from "@ant-design/icons";
import { fetchProfile } from "@/utils/auth";

const SideBar = () => {
  const params = useParams();
  const id = params.id;
  const route = useRouter();

  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);
  const [style, setStyle] = useState("Thorough and academic tone");

  useEffect(() => {
    const getList = async () => {
      const profile = await fetchProfile();
      let email = "hust@gmail.com"
      if (profile) {
        email = profile.email
      }
      axios.get("/api/chat?email=" + email).then((res) => {
        setList(res.data);
      });
    }
    getList();
  }, [id]);

  const handleDelete = async (chatId: string) => {
    try {
      await axios.delete(`/api/chat/${chatId}`);
      setList((prev: any) => prev.filter((c: any) => c.id !== chatId));
      if (chatId === id) route.push("/chatbot");
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div
      className={`py-6 hidden md:flex flex-col justify-between px-4 transition-all duration-300 ease-in-out ${open ? "w-60" : "w-20"
        }`}
    >
      <div className="flex flex-col">
        {/* Logo / Toggle Menu */}
        <div className="pt-[0.625rem]">
          <Tooltip title="Menu" placement="right">
            <Image
              alt="toggle"
              src={"/1.png"}
              width={48}
              height={48}
              className="w-12 h-12 cursor-pointer"
              onClick={() => setOpen((prev) => !prev)}
            />
          </Tooltip>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {!open ? (
            <Tooltip title="Chatbot" placement="right">
              <Image
                alt="home"
                src={"/2.png"}
                width={48}
                height={48}
                className="w-12 h-12 object-cover cursor-pointer"
                onClick={() => route.push("/chatbot")}
              />
            </Tooltip>
          ) : (
            <div className="flex gap-1 flex-col">
              <div
                className="flex gap-2 items-center rounded-sm hover:bg-gray-200 dark:hover:bg-gray-800 px-2 py-1 cursor-pointer"
                onClick={() => route.push("/chatbot")}
              >
                <Image
                  alt="new chat"
                  src={"/2.png"}
                  width={48}
                  height={48}
                  className="w-12 h-12 object-cover"
                />
                <span className="font-medium text-sm">New chat</span>
              </div>

              {/* Chat History List */}
              <div className="flex flex-col gap-1 mt-2 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {list.map((chat: any) => {
                  const isActive = chat.id === id;

                  // Cấu hình menu cho Dropdown Antd
                  const menuItems: MenuProps['items'] = [
                    {
                      key: 'delete',
                      danger: true,
                      label: (
                        <Popconfirm
                          title="Delete this chat?"
                          description="This action cannot be undone."
                          onConfirm={() => handleDelete(chat.id)}
                          okText="Yes"
                          cancelText="No"
                          okButtonProps={{ danger: true }}
                        >
                          <div className="w-full flex items-center gap-2">
                            <DeleteOutlined /> Delete
                          </div>
                        </Popconfirm>
                      ),
                    },
                  ];

                  return (
                    <div
                      key={chat.id}
                      className={`flex items-center justify-between p-2 rounded-md transition text-sm group ${isActive
                        ? "bg-gray-300 dark:bg-gray-700 font-semibold"
                        : "hover:bg-gray-200 dark:hover:bg-gray-800 font-light"
                        }`}
                    >
                      <Link href={"/chatbot/" + chat.id} className="flex-1 truncate mr-2 text-black dark:text-white">
                        {chat.Mess?.[0]?.text?.slice(0, 20) || "(No message)"}
                      </Link>

                      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                        <Button
                          type="text"
                          size="small"
                          className="opacity-0 group-hover:opacity-100 flex items-center justify-center"
                          icon={<MoreOutlined className="w-4 h-4" />}
                        />
                      </Dropdown>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2">
        {/* About Dialog */}
        <Tooltip title={!open ? "About" : ""} placement="right">
          <div
            className="flex gap-1 items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 px-2 py-1 rounded-sm transition"
            onClick={() => setAboutOpen(true)}
          >
            <Image alt="about" src={"/4.png"} width={48} height={48} className="w-12 h-12 object-cover" />
            {open && <p className="font-bold ml-1">About</p>}
          </div>
        </Tooltip>

        {/* Setting Dialog */}
        <Tooltip title={!open ? "Setting" : ""} placement="right">
          <div
            className="flex gap-1 items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 px-2 py-1 rounded-sm transition"
            onClick={() => setSettingOpen(true)}
          >
            <Image alt="setting" src={"/6.png"} width={48} height={48} className="w-12 h-12 object-cover" />
            {open && <p className="font-bold ml-1">Setting</p>}
          </div>
        </Tooltip>
      </div>

      {/* Ant Design Modals */}
      <Modal
        title="About This App"
        open={aboutOpen}
        onCancel={() => setAboutOpen(false)}
        footer={null}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <strong>Research Paper Assistant</strong> is your intelligent companion for academic work.
          It helps you effortlessly organize, search, and have meaningful conversations with your research materials.
          Whether you’re exploring complex theories, summarizing lengthy papers, or preparing for publication,
          this tool streamlines your workflow.
        </p>
      </Modal>

      <Modal
        title="Settings"
        open={settingOpen}
        onCancel={() => setSettingOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSettingOpen(false)}>
            Done
          </Button>
        ]}
      >
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Writing Style / Tone:
            </label>
            <Input
              placeholder="e.g. Formal and concise"
              value={style}
              onChange={(e) => {
                const newStyle = e.target.value;
                setStyle(newStyle);
                localStorage.setItem("writingStyle", newStyle);
              }}
            />
            <p className="text-xs text-gray-500 mt-2 italic">
              Describe how you want the assistant to write (Example: “Formal and concise”, “Warm and supportive”).
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SideBar;