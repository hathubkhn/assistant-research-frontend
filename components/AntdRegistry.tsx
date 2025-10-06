"use client";

import React from "react";
import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider } from "antd";

export default function AntdRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#1e40af", // Match your existing blue theme
            borderRadius: 8,
            fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
          },
          components: {
            Button: {
              controlHeight: 40,
            },
            Input: {
              controlHeight: 40,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
