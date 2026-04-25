import type { Metadata } from "next";
import { Inter, Inter_Tight, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// D-11: self-host Inter / Inter Tight / Geist Mono via next/font with CSS-variable strategy.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sextant",
  description: "Frame a scientific question. Get a fundable plan in 3 minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${interTight.variable} ${geistMono.variable} font-sans bg-paper text-ink antialiased min-h-full flex flex-col`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
