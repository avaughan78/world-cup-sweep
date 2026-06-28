import type { Metadata } from "next";
import { Geist, Geist_Mono, Bungee, Oswald } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import FootballPhysicsGate from "@/components/FootballPhysicsGate";

const GA_ID = 'G-HKXK5EQM9X';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bungee = Bungee({
  variable: "--font-bungee",
  subsets: ["latin"],
  weight: "400",
});

const oswald = Oswald({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "World Cup 2026",
  description: "Tracker for the 2026 FIFA World Cup",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bungee.variable} ${oswald.variable} h-full antialiased`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-component */}
        <script data-goatcounter="https://wcsweep.goatcounter.com/count" async src="//gc.zgo.at/count.js" />
      </head>
      <body className="min-h-full flex flex-col">
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
        <FootballPhysicsGate />
        {children}
      </body>
    </html>
  );
}
