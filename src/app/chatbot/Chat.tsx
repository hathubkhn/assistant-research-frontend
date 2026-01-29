"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Input, Skeleton, Space } from "antd"; // Import từ antd
import UserChat from "./[id]/UserChat";

const prompts = [
  "Discover relevant research papers",
  "Organize your research efficiently",
  "Stay updated with latest studies",
  "Find papers that match your interests",
  "Track citations and references easily",
  "Explore research trends",
];

const Chat = ({ profile }: any) => {
  const [text, setText] = useState("");
  const [newChat, setNewChat] = useState(true);
  const [loading, setLoading] = useState(false);
  const route = useRouter();

  const sendMess = () => {
    if (!text.trim()) return; // Tránh gửi tin nhắn rỗng

    setLoading(true);
    setNewChat(false);
    
    axios
      .post("/api/chat", {
        text: text,
        email: profile?.email,
      })
      .then((data) => route.push("chatbot/"+data.data.chatId))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-full overflow-auto mx-2">
        <div className="flex-1 w-full px-2 md:px-0 md:w-[57.5rem] mx-auto">
          <div className="h-full flex flex-col">
            {newChat ? (
              <div className="flex flex-col justify-end h-full">
                <div className="flex flex-col items-center md:px-52 pb-12 pt-10">
                  <Image
                    src="/logo1.png"
                    alt="logo1"
                    height={80}
                    width={80}
                    className="w-20 h-20 object-contain"
                  />
                  <p className="text-2xl font-bold pt-3 pb-5">Chatbot</p>
                  <p className="text-center text-base font-semibold text-[#A3A3A3]">
                    And visually appealing, thanks to its comprehensive set of
                    pre-designed components and customizable elements.{" "}
                  </p>
                </div>
                <div className="bg-gray-100 rounded-xl py-8 px-14">
                  <p className="text-2xl font-bold text-center pb-8">
                    Prompt Suggestions For You
                  </p>
                  <div className="flex gap-6 flex-wrap">
                    {prompts.map((prompt, index) => (
                      <div
                        key={index}
                        onClick={() => setText(prompt)} // Click vào gợi ý để điền text
                        className="flex gap-2 py-3 px-4 rounded-full bg-[#E5E5E5] cursor-pointer hover:bg-gray-300 transition-colors"
                      >
                        <Image
                          src={"/logo2.png"}
                          width={20}
                          height={20}
                          alt="logo"
                          className="w-5 h-5 object-contain"
                        />
                        <span className="font-semibold">{prompt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <UserChat 
                data={{ text: text }} 
                image={profile?.image!} 
                name={profile?.name!} 
              />
            )}

            {loading && (
              <div className="mt-4 p-4">
                {/* Sử dụng Skeleton của Ant Design */}
                <Skeleton active avatar={{ shape: 'circle' }} paragraph={{ rows: 3 }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="py-8 pt-0 w-full px-2 md:px-0 md:w-[57.5rem] mx-auto">
        <Input
          size="large"
          className="w-full"
          placeholder="Ask me anything"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={sendMess} // Antd hỗ trợ sẵn onPressEnter thay vì check e.key == "Enter"
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default Chat;