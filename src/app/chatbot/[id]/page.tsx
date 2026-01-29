import { Metadata } from "next";
import Chat from "./Chat";
import { fetchProfile } from "@/utils/auth";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chatbot",
  description: "Chatbot",
};

export default async function ChatProvider({ params }: { params: { id: string } }) {
  const { id } = await params;

  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/chat/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch chat data");
  }
  const profile = await fetchProfile();
  let profile_
  if (!profile) {
    // return (
    //   <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
    //     <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
    //       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Length12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    //       </svg>
    //     </div>
    //     <h2 className="text-xl font-semibold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
    //     <p className="text-gray-500 text-center max-w-sm mb-6">
    //       Bạn cần đăng nhập vào hệ thống để có thể sử dụng đầy đủ các tính năng của chức năng này.
    //     </p>
    //     <Link href={'/login'} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm">
    //       Đăng nhập ngay
    //     </Link>
    //   </div>
    // );
    profile_ = {
      email: "hust@gmail.com",
      name: "Hust",
      image: "/vpbank1.png"
    }
  }
  else{
    profile_ = {
      email: profile?.email,
      name: profile?.username,
      image: profile?.avatar_url
    }
  }
  const chats = await res.json();

  return <Chat chats={chats} id={id} profile={profile_}/>;
}
