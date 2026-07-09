import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Base Game Migration Alpha",
  description:
    "Nakama-first game migration demo for mock Base Pay ticket packs and Builder Code attribution.",
  icons: {
    icon: "/bgm-gamepad-logo.svg",
  },
  other: {
    "talentapp:project_verification":
      "8f6c4adcd47c3162c89d0df41b93a8c03cca6027df58aa67582cf5b792f8a2e38e68dca0fb8e8186bb64152d836f8277e549ac0586e34fc21005a1151529444f",
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
