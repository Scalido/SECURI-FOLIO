"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, FileSearch, GraduationCap, Home, Menu, X, Lock, Shield, Map, User, ZapOff, Zap, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [ecoMode, setEcoMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Gérer l'activation du Mode Éco / Terrain
  useEffect(() => {
    if (ecoMode) {
      document.body.classList.add("eco-mode");
    } else {
      document.body.classList.remove("eco-mode");
    }
  }, [ecoMode]);

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

        {/* Right Side: Secure Badge, Agent Identity & Controls */}
        <div className="flex items-center gap-4">
          
          {/* Agent Identity */}
          {user ? (
            <div className="hidden md:flex flex-col items-end mr-2">
              <div className="flex items-center gap-2 text-brand-text">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Agent:</span>
                <span className="text-xs font-mono font-bold text-brand-accent truncate max-w-[150px]">{user.email}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <User size={10} /> Connecté
              </div>
            </div>
          ) : (
            <Link href="/login" className="hidden md:flex text-xs font-bold uppercase tracking-widest text-brand-primary border border-brand-primary/50 bg-brand-primary/10 hover:bg-brand-primary/20 px-4 py-2 rounded-xl transition-all">
              Connexion Agent
            </Link>
          )}

          <div className="hidden md:flex items-center gap-2 border-l border-brand-border pl-4">
            {/* Mode Terrain / Éco Toggle */}
            <button
              onClick={() => setEcoMode(!ecoMode)}
              title={ecoMode ? "Désactiver le Mode Terrain" : "Activer le Mode Terrain (Basse Connexion)"}
              className={`p-2 rounded-lg border transition-all duration-200 ${
                ecoMode 
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                  : "bg-brand-surface border-brand-border text-slate-400 hover:text-white"
              }`}
            >
              {ecoMode ? <ZapOff size={16} /> : <Zap size={16} />}
            </button>

            {/* Clearance Badge & SignOut */}
            {user && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-widest bg-brand-primary/10 border border-brand-primary/20 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <Lock size={12} />
                L4 Clearance
                <button onClick={handleSignOut} title="Déconnexion" className="ml-2 pl-2 border-l border-brand-primary/30 text-slate-400 hover:text-red-400 transition-colors">
                  <LogOut size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-brand-surface rounded-xl transition-all border border-transparent hover:border-brand-border"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-bg/95 backdrop-blur-lg animate-in slide-in-from-top duration-200 shadow-2xl">
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

          {/* Mobile Identity & Controls */}
          <div className="px-4 pb-6 pt-2 border-t border-brand-border/50">
            {user ? (
              <div className="flex items-center justify-between bg-brand-surface p-3 rounded-xl border border-brand-border shadow-inner">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                    <User size={12} />
                    Agent Connecté
                  </div>
                  <span className="text-xs font-mono font-bold text-brand-accent mt-0.5 max-w-[150px] truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-brand-primary uppercase bg-brand-primary/10 border border-brand-primary/20 px-2 py-1 rounded-md">
                    <Lock size={10} /> L4
                  </div>
                  <button onClick={() => { handleSignOut(); setIsOpen(false); }} className="text-slate-400 hover:text-red-400 transition-colors p-1">
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                href="/login" 
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-primary border border-brand-primary/30 bg-brand-primary/10 hover:bg-brand-primary/20 px-4 py-3 rounded-xl transition-all"
              >
                <Lock size={14} /> Connexion Agent
              </Link>
            )}

            <button
              onClick={() => { setEcoMode(!ecoMode); setIsOpen(false); }}
              className={`w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all duration-200 ${
                ecoMode 
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                  : "bg-brand-surface border-brand-border text-slate-400"
              }`}
            >
              {ecoMode ? <ZapOff size={16} /> : <Zap size={16} />}
              {ecoMode ? "Désactiver Mode Terrain" : "Activer Mode Terrain"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
