"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, FileSearch, GraduationCap, Home, Landmark, Menu, X, Lock, Shield, Map } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Anti-Folio", href: "/anti-folio", icon: ShieldCheck },
    { name: "Smart-Archive", href: "/smart-archive", icon: FileSearch },
    { name: "Foncier-Édu", href: "/assistant", icon: GraduationCap },
  ];

  return (
    <header className="bg-brand-bg/80 border-b border-brand-border/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
      {/* DRC Flag line at the very top */}
      <div className="absolute top-0 left-0 w-full h-[2px] flex">
        <div className="h-full bg-[#007FFF] flex-1"></div>
        <div className="h-full bg-[#F7D618] flex-1"></div>
        <div className="h-full bg-[#CE1126] flex-1"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Title */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-8 h-8 group-hover:scale-105 transition-transform duration-200">
            <Shield size={32} className="text-brand-accent absolute" strokeWidth={1.5} />
            <Map size={14} className="text-brand-primary absolute mt-1" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-display font-black text-sm md:text-base text-white tracking-tight">
              Sécurifolio <span className="text-brand-primary">RDC</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider -mt-0.5">
              Affaires Foncières
            </p>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  isActive 
                    ? "bg-brand-surface text-brand-primary shadow-[0_0_15px_rgba(16,185,129,0.15)] border border-brand-border" 
                    : "text-slate-400 hover:bg-brand-surface hover:text-white"
                }`}
              >
                <Icon size={14} className={isActive ? "text-brand-primary" : "text-slate-500"} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Secure Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-widest bg-brand-primary/10 border border-brand-primary/20 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <Lock size={12} />
            L4 Clearance
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-brand-surface rounded-xl transition-all"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-bg/95 backdrop-blur-lg animate-in slide-in-from-top duration-200">
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
                      ? "bg-brand-surface text-brand-primary border border-brand-border shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                      : "text-slate-400 hover:bg-brand-surface"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-brand-primary" : "text-slate-500"} />
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
