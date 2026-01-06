import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/ui/SmoothScroll";
import Header from "@/components/ui/Header";
import CustomCursor from "@/components/ui/CustomCursor";
import { UIProvider } from "@/context/UIContext";
import { Toaster } from "@/components/ui/Toaster";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"], // Variable font axes
});

export const metadata: Metadata = {
  title: "VoiceSOP - AI SOP Generator",
  description: "Turn messy voice notes into professional SOPs in 60 seconds, using advanced AI.",
  openGraph: {
    title: "VoiceSOP - AI SOP Generator",
    description: "Turn messy voice notes into professional SOPs in 60 seconds.",
    url: "https://voicesop.com",
    siteName: "VoiceSOP",
    images: [
      {
        url: "/og-image.png", // We don't have this image yet but it's good practice to link it
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VoiceSOP - AI SOP Generator",
    description: "Turn messy voice notes into professional SOPs in 60 seconds.",
  },
  icons: {
    icon: "/favicon.ico", // User mentioned they have this
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} antialiased`}
      >
        <UIProvider>
          <CustomCursor />
          <SmoothScroll>
            <Header />
            {children}
            <Toaster />
          </SmoothScroll>
        </UIProvider>
      </body>
    </html>
  );
}
