import type { Metadata, Viewport } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { Gatekeeper } from "@/components/Gatekeeper";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "AP Practice Partners",
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
    title: "AP Practice Partners",
    description: "AI-powered AP tutors strictly aligned with official College Board Course and Exam Descriptions.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AP Practice Partners",
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
      <body className={`${inter.variable} ${nunito.variable} font-sans min-h-screen`}>
        <ThemeProvider>
          <Gatekeeper>
            {children}
          </Gatekeeper>
        </ThemeProvider>
      </body>
    </html>
  );
}
