import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/ui/SmoothScroll";
import Header from "@/components/ui/Header";
import CustomCursor from "@/components/ui/CustomCursor";
import { UIProvider } from "@/context/UIContext";

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
  description: "Turn messy voice notes into professional SOPs in 60 seconds.",
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
          </SmoothScroll>
        </UIProvider>
      </body>
    </html>
  );
}
