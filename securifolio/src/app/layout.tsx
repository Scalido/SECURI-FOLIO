import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "SÉCURIFOLIO RDC | Ministère des Affaires Foncières",
  description: "Système d&apos;authentification et de numérisation du Ministère des Affaires Foncières de la RDC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col h-screen overflow-hidden`}>
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </body>
    </html>
  );
}
