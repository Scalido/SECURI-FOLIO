"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, ShieldAlert, Bot, BookOpen, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  content: string;
  coverage?: "covered" | "partial" | "not_covered";
  sources?: SourceReference[];
};

type SourceReference = {
  sourceId: string;
  title: string;
  authority: string;
  kind: "law" | "regulation" | "guide" | "working_summary";
  provenance: string;
  verification: "official" | "secondary" | "unverified";
  section: string;
  excerpt: string;
};

const coverageLabels = {
  covered: "Question couverte par les passages cités",
  partial: "Couverture documentaire partielle",
  not_covered: "Information insuffisante dans les documents",
};

const verificationLabels = {
  official: "Document institutionnel",
  secondary: "Copie secondaire identifiée",
  unverified: "Document de travail non vérifié",
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Bonjour. Je suis Foncier-Édu, un assistant pédagogique d’information foncière en RDC.\n\nJe peux expliquer les procédures présentes dans la documentation Securifolio et indiquer les passages utilisés. Les réponses sont informatives : elles ne constituent ni une décision administrative, ni une consultation juridique, ni une preuve de droit.\n\nLorsqu’une question n’est pas couverte par les documents disponibles, je dois le signaler sans spéculer."
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPublicUser, setIsPublicUser] = useState(false);
  const [accessLabel, setAccessLabel] = useState("Limites serveur actives");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsPublicUser(true);
      }
    };
    checkUser();
  }, [supabase.auth]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await res.json();
      if (data.accessLabel) setAccessLabel(data.accessLabel);
      if (!res.ok) throw new Error(data.error || "Erreur de connexion au serveur");

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.content,
        coverage: data.coverage,
        sources: data.sources,
      }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: error instanceof Error
          ? error.message
          : "Le service documentaire est temporairement indisponible.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-4xl mx-auto bg-brand-bg border-x border-slate-200 dark:border-brand-border shadow-[0_0_50px_rgba(16,185,129,0.03)] relative overflow-hidden transition-colors duration-200">
      
      {/* Glow Effect */}
      <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="bg-white dark:bg-brand-surface/80 border-b border-slate-200 dark:border-brand-border p-3 sm:p-5 flex items-center justify-between shadow-sm relative z-10 backdrop-blur-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-brand-bg p-2 sm:p-3 rounded-xl text-brand-primary border border-slate-200 dark:border-brand-border shadow-[0_0_15px_rgba(16,185,129,0.1)] hidden sm:flex">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
              Foncier-Édu
            </h1>
            <p className="text-[8px] sm:text-[10px] text-brand-primary font-bold flex items-center gap-1 mt-0.5 sm:mt-1 uppercase tracking-widest bg-brand-primary/10 w-fit px-1.5 sm:px-2 py-0.5 rounded border border-brand-primary/20">
              <ShieldAlert size={10} className="hidden sm:block" />
              Citations documentaires contrôlées
            </p>
          </div>
        </div>
        {isPublicUser && (
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
            <span>Accès public · {accessLabel}</span>
            <Link href="/login" className="text-brand-primary underline ml-1">Se connecter</Link>
          </div>
        )}
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 sm:space-y-8 relative z-10 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm border ${
                msg.role === "user" 
                  ? "bg-brand-primary/20 text-brand-primary border-brand-primary/30" 
                  : "bg-white dark:bg-brand-surface text-slate-600 dark:text-slate-300 border-slate-200 dark:border-brand-border"
              }`}>
                {msg.role === "user" ? <User size={18} /> : <Bot size={18} className="text-brand-accent" />}
              </div>
              <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" 
                  ? "bg-brand-primary/10 text-emerald-50 border border-brand-primary/20 rounded-tr-sm shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
                  : "bg-white dark:bg-brand-surface/80 border border-slate-200 dark:border-brand-border text-slate-600 dark:text-slate-300 rounded-tl-sm shadow-[0_0_15px_rgba(0,0,0,0.2)]"
              }`}>
                <div className="space-y-2 font-medium">
                  {msg.content.split("\n").filter(Boolean).map((line, lineIndex) => (
                    <p
                      key={lineIndex}
                      className={line.startsWith("- ") || line.startsWith("• ") ? "pl-4 relative before:absolute before:left-0 before:content-['•']" : ""}
                    >
                      {line.replace(/^[-•]\s*/, "")}
                    </p>
                  ))}
                </div>
                {msg.role === "assistant" && msg.coverage && (
                  <div className={`mt-4 rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
                    msg.coverage === "covered"
                      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                  }`}>
                    {coverageLabels[msg.coverage]}
                  </div>
                )}
                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-brand-border">
                    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <BookOpen size={13} /> Sources utilisées
                    </p>
                    {msg.sources.map((source, sourceIndex) => (
                      <article key={`${source.sourceId}-${sourceIndex}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-brand-border dark:bg-brand-bg/60">
                        <p className="font-bold text-slate-900 dark:text-white">{source.title}</p>
                        <p className="mt-1 text-[10px] text-slate-500">{source.section} · {verificationLabels[source.verification]}</p>
                        <blockquote className="mt-2 border-l-2 border-brand-primary/50 pl-3 text-slate-600 dark:text-slate-300">
                          {source.excerpt}
                        </blockquote>
                        <p className="mt-2 text-[9px] text-slate-400">{source.provenance}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-4 max-w-[80%]">
              <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-white dark:bg-brand-surface text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-brand-border">
                <Bot size={18} className="text-brand-accent" />
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-brand-surface/80 border border-slate-200 dark:border-brand-border rounded-tl-sm flex items-center h-14 shadow-sm">
                <div className="flex gap-2 px-2">
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce shadow-[0_0_5px_rgba(16,185,129,0.5)]" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce shadow-[0_0_5px_rgba(16,185,129,0.5)]" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce shadow-[0_0_5px_rgba(16,185,129,0.5)]" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-white dark:bg-brand-surface/80 backdrop-blur-xl border-t border-slate-200 dark:border-brand-border relative z-10">
        <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 relative max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question sur les textes et procédures disponibles..."
            className="flex-1 border border-slate-200 dark:border-brand-border rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-6 pr-14 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary text-sm text-slate-900 dark:text-white bg-brand-bg placeholder-slate-500 shadow-inner font-medium transition-all disabled:opacity-50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 bg-brand-primary text-brand-bg rounded-lg sm:rounded-xl w-10 sm:w-12 flex items-center justify-center hover:bg-emerald-400 transition-all disabled:bg-brand-surface disabled:text-slate-600 border border-transparent disabled:border-brand-border shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:shadow-none"
          >
            {isLoading ? <Lock size={16} className="sm:w-[18px] sm:h-[18px] ml-0.5 opacity-50" /> : <Send size={16} className="sm:w-[18px] sm:h-[18px] ml-0.5" />}
          </button>
        </form>
        <div className="mt-2 text-center">
          <p className="text-[9px] text-slate-400 dark:text-slate-500">
            Information générale fondée sur les passages cités. Ne remplace ni le service foncier compétent, ni un professionnel du droit, ni une juridiction.
          </p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.4); }
      `}} />
    </div>
  );
}
