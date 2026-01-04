"use client";
import React, { useEffect, useRef, useState } from "react";
import { Input, Skeleton } from "antd"; // Sử dụng antd
import UserChat from "./UserChat";
import BotChat from "./BotChat";
import AutoScrollContainer from "@/app/components/AutoScrollContainer";

const Chat = ({ chats, id, profile }: any) => {
  const [chat, setChat] = useState(chats.Mess);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const didRun = useRef(false);

  useEffect(() => {
    if (chat.length === 1 && !didRun.current) {
      didRun.current = true;
      sendMess(true);
    }
  }, [chat]);

  const sendMess = async (isNewChat: boolean) => {
    // Nếu không phải chat mới mà text rỗng thì không gửi
    if (!text.trim() && isNewChat === false) return;
    
    setLoading(true);
    const userText = text;
    setText("");

    if (isNewChat === false) {
      setChat((prev: any) => [
        ...prev,
        { id: Math.random(), text: userText, type: "user" },
      ]);
    }

    try {
      const res = await fetch(`/api/chat/${id}`, {
        method: "POST",
        body: JSON.stringify({ text: userText, type: "user" }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let botMessage = "";
      const botId = Math.random();

      setChat((prev: any) => [
        ...prev,
        { id: botId, text: "", type: "bot" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        botMessage += chunk;

        setChat((prev: any) =>
          prev.map((m: any) =>
            m.id === botId ? { ...m, text: botMessage } : m
          )
        );
      }

      // Lưu tin nhắn bot vào DB sau khi stream xong
      await fetch(`/api/chat/${id}`, {
        method: "POST",
        body: JSON.stringify({ text: botMessage, type: "bot" }),
      });
    } catch (err) {
      console.error(err);
      setChat((prev: any) => [
        ...prev,
        { id: Math.random(), text: "Bot failed to respond.", type: "bot" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-full overflow-auto mx-2">
        <div className="flex-1 w-full px-2 md:px-0 md:w-[57.5rem] mx-auto">
          <div className="h-full flex flex-col">
            <AutoScrollContainer>
              {chat.map((mess: any) =>
                mess?.type === "user" ? (
                  <UserChat
                    key={mess.id}
                    data={mess}
                    image={profile.image!}
                    name={profile.name!}
                  />
                ) : (
                  <BotChat key={mess.id} data={mess} />
                )
              )}
              
              {loading && chat[chat.length - 1]?.text === "" && (
                <div className="flex items-start gap-3 pb-8 mt-4">
                  <div className="w-full">
                    {/* Skeleton của Ant Design với hiệu ứng active */}
                    <Skeleton 
                      active 
                      title={false} 
                      paragraph={{ rows: 3, width: ['100%', '100%', '70%'] }} 
                    />
                  </div>
                </div>
              )}
            </AutoScrollContainer>
          </div>
        </div>
      </div>

      <div className="py-8 pt-0 w-full px-2 md:px-0 md:w-[57.5rem] mx-auto">
        <Input
          size="large"
          className="w-full placeholder:text-[#A3A3A3]"
          placeholder="Ask me anything"
          disabled={loading}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={() => sendMess(false)} // Thay thế onKeyDown Enter
        />
      </div>
    </div>
  );
};

export default Chat;