import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Gatekeeper } from "@/components/Gatekeeper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AP Practice Partners",
  description: "AI-powered AP tutors strictly aligned with official College Board Course and Exam Descriptions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 min-h-screen`}>
        <Gatekeeper>
          {children}
        </Gatekeeper>
      </body>
    </html>
  );
}
