import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-inter",
});

const spaceGrotesk = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Sécurifolio RDC | Ministère des Affaires Foncières",
  description: "Système d'authentification et de numérisation du Ministère des Affaires Foncières de la RDC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-[#0B0F19] text-slate-300 min-h-screen flex flex-col overflow-x-hidden selection:bg-brand-secondary/30 selection:text-brand-secondary`}>
        <Navbar />
        <main className="flex-1 w-full bg-[#0B0F19] flex flex-col">
          <div className="flex-1 flex flex-col w-full">
            {children}
          </div>
          <Footer />
        </main>
      </body>
    </html>
  );
}
