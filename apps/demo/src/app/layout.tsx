import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Base Game Migration Alpha",
  description:
    "Nakama-first game migration demo for mock Base Pay ticket packs and Builder Code attribution.",
  icons: {
    icon: "/bgm-gamepad-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
