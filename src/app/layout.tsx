import type { Metadata, Viewport } from "next";
import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Gatekeeper } from "@/components/Gatekeeper";
import { FirstVisitGate } from "@/components/FirstVisitGate";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Analytics } from "@vercel/analytics/react";

const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", style: ['normal', 'italic'] });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });

export const metadata: Metadata = {
  title: "AP Study Bots",
  description: "AI-powered AP tutors strictly aligned with official College Board Course and Exam Descriptions.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "AP Study Bots",
    description: "AI-powered AP tutors strictly aligned with official College Board Course and Exam Descriptions.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AP Study Bots",
    description: "AI-powered AP tutors strictly aligned with official College Board Course and Exam Descriptions.",
    images: ["/og-image.png"],
  },
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${newsreader.variable} ${plusJakarta.variable} font-sans min-h-screen`}>
        <ThemeProvider>
          <Gatekeeper>
            <FirstVisitGate>
              <div className="flex min-h-screen overflow-hidden bg-background">
                <Sidebar />
                <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
                  {children}
                </main>
                <MobileNav />
              </div>
            </FirstVisitGate>
          </Gatekeeper>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
