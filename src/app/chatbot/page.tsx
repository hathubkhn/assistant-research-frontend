import { Metadata } from "next";
import React from "react";
import Chat from "./Chat";
import { fetchProfile } from "@/utils/auth";
export const metadata: Metadata = {
  title: "Chatbot",
  description: "Chatbot",
};

const ChatProvider = async () => {
  const profile = await fetchProfile();
  let profile_
  if (profile) {
    // return (
    //   <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
    //     <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
    //       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Length12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    //       </svg>
    //     </div>
    //     <h2 className="text-xl font-semibold text-gray-800 mb-2">Login Required</h2>
    //     <p className="text-gray-500 text-center max-w-sm mb-6">
    //       Please log in to access all the features of this function.
    //     </p>
    //     <Link href={'/login'} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm">
    //       Login
    //     </Link>
    //   </div>
    // );
    profile_ = {
      email: profile?.email,
      name: profile?.username,
      image: profile?.avatar_url
    }
  }
  else {
    profile_ = {
      email: "hust@gmail.com",
      name: "Hust",
      image: "/vpbank1.png"
    }
  }
  return <Chat profile={profile_} />;
};

export default ChatProvider;
