"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, FileSearch, GraduationCap, Home, Landmark, Menu, X, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const isDarkStored = localStorage.getItem("theme") !== "light"; // default to dark
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    if (newDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const navItems = [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Anti-Folio", href: "/anti-folio", icon: ShieldCheck },
    { name: "Smart-Archive", href: "/smart-archive", icon: FileSearch },
    { name: "Foncier-Édu", href: "/assistant", icon: GraduationCap },
  ];

  return (
    <header className="bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-900 backdrop-blur-md sticky top-0 z-50 shadow-sm transition-colors duration-200">
      {/* DRC Flag line at the very top */}
      <div className="absolute top-0 left-0 w-full h-[3px] flex">
        <div className="h-full bg-[#007FFF] flex-1"></div>
        <div className="h-full bg-[#F7D618] flex-1"></div>
        <div className="h-full bg-[#CE1126] flex-1"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-[#0a192f] dark:bg-[#112240] text-white p-2 rounded-xl group-hover:scale-105 transition-transform duration-200 border border-slate-200 dark:border-slate-800 shadow-sm">
            <Landmark size={20} className="text-[#F7D618]" />
          </div>
          <div>
            <h1 className="font-display font-black text-sm md:text-base text-slate-800 dark:text-white tracking-tight">
              SÉCURIFOLIO <span className="text-[#007FFF]">RDC</span>
            </h1>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider -mt-0.5">
              Affaires Foncières
            </p>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  isActive 
                    ? "bg-[#0a192f] dark:bg-[#112240] text-white dark:text-white shadow-sm border border-slate-250 dark:border-slate-800" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[#F7D618]" : "text-slate-400 dark:text-slate-500"} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Theme Switcher & Institution Tag */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all border border-slate-200 dark:border-slate-800 shadow-sm"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <span className="hidden lg:inline-block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full">
            CTI - Rép. Dém. du Congo
          </span>
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-900 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg shadow-lg animate-in slide-in-from-top duration-200">
          <nav className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive 
                      ? "bg-[#0a192f] dark:bg-[#112240] text-white border border-slate-250 dark:border-slate-800" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-[#F7D618]" : "text-slate-400 dark:text-slate-500"} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
