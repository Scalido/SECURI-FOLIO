"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, ShieldAlert, Bot, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Bonjour. Je suis l'assistant Foncier-Édu. Comment puis-je vous conseiller sur le régime foncier congolais ou l'application de la Loi n° 25/062 (Loi N'Sele) ?"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPublicUser, setIsPublicUser] = useState(false);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const PUBLIC_LIMIT = 3;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsPublicUser(true);
        const count = parseInt(localStorage.getItem("foncier_edu_count") || "0");
        setQuestionsCount(count);
        if (count >= PUBLIC_LIMIT) {
          setIsLimitReached(true);
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "⚠️ Vous avez atteint la limite de requêtes gratuites (3/3) pour le public. Pour continuer à utiliser Foncier-Édu en illimité, veuillez vous connecter avec un compte Agent officiel."
          }]);
        }
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
    if (!input.trim() || isLoading || isLimitReached) return;

    if (isPublicUser) {
      const newCount = questionsCount + 1;
      setQuestionsCount(newCount);
      localStorage.setItem("foncier_edu_count", newCount.toString());
      if (newCount >= PUBLIC_LIMIT) {
        setIsLimitReached(true);
      }
    }

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

      if (!res.ok) throw new Error("Erreur de connexion au serveur");

      const data = await res.json();
      setMessages((prev) => {
        const newMessages = [...prev, data];
        if (isPublicUser && questionsCount + 1 >= PUBLIC_LIMIT) {
          newMessages.push({
            role: "assistant",
            content: "⚠️ Vous avez atteint la limite de requêtes gratuites (3/3) pour le public. Pour continuer à utiliser Foncier-Édu en illimité, veuillez vous connecter avec un compte Agent officiel."
          });
        }
        return newMessages;
      });
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue lors de la connexion au serveur." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-4xl mx-auto bg-brand-bg border-x border-slate-200 dark:border-brand-border shadow-[0_0_50px_rgba(16,185,129,0.03)] relative overflow-hidden transition-colors duration-200">
      
      {/* Glow Effect */}
      <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="bg-white dark:bg-brand-surface/80 border-b border-slate-200 dark:border-brand-border p-5 flex items-center justify-between shadow-sm relative z-10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="bg-brand-bg p-3 rounded-xl text-brand-primary border border-slate-200 dark:border-brand-border shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
              Assistant Foncier RDC
            </h1>
            <p className="text-[10px] text-brand-primary font-bold flex items-center gap-1.5 mt-1 uppercase tracking-widest bg-brand-primary/10 w-fit px-2 py-0.5 rounded border border-brand-primary/20">
              <ShieldAlert size={10} />
              Verrou d&apos;intégrité légale activé
            </p>
          </div>
        </div>
        {isPublicUser && (
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
            <span>Accès Public : {questionsCount}/{PUBLIC_LIMIT}</span>
            {isLimitReached && <Link href="/login" className="text-brand-primary underline ml-1">Connexion Agent</Link>}
          </div>
        )}
      </div>
      
      {/* Bandeau Informatif */}
      <div className="bg-white dark:bg-brand-surface/40 p-5 sm:px-8 border-b border-slate-200 dark:border-brand-border text-xs text-slate-500 dark:text-slate-400 relative z-10">
        <p className="font-bold text-slate-200 mb-3 text-sm">Textes de loi maîtrisés par l&apos;assistant :</p>
        <ul className="space-y-2 mb-4">
          <li className="flex items-center gap-2"><span className="text-brand-primary">■</span> Loi Foncière (Loi 73-021 modifiée par Loi 25/062 de 2025)</li>
          <li className="flex items-center gap-2"><span className="text-brand-primary">■</span> Ordonnance n° 74/148 (Mesures d&apos;exécution)</li>
          <li className="flex items-center gap-2"><span className="text-brand-primary">■</span> Loi n° 15/025 de 2015 sur les Baux à loyer</li>
          <li className="flex items-center gap-2"><span className="text-brand-primary">■</span> Arrêtés n° 0075 et n° 90-0012</li>
        </ul>
        <div className="bg-brand-accent/10 text-brand-accent p-3 rounded-xl border border-brand-accent/20 font-medium flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            <strong>Verrou d&apos;intégrité :</strong> Cet assistant ne fait aucune déduction hasardeuse. En cas de doute juridique ou de situation complexe non prévue par les textes, il vous orientera vers un Conservateur officiel.
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 relative z-10 custom-scrollbar">
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
                <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
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
      <div className="p-5 sm:p-6 bg-white dark:bg-brand-surface/80 backdrop-blur-xl border-t border-slate-200 dark:border-brand-border relative z-10">
        <form onSubmit={handleSubmit} className="flex gap-3 relative max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLimitReached ? "Limite atteinte. Connexion requise." : "Posez votre question sur la législation foncière..."}
            className="flex-1 border border-slate-200 dark:border-brand-border rounded-2xl py-4 px-6 pr-16 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary text-sm text-slate-900 dark:text-white bg-brand-bg placeholder-slate-500 shadow-inner font-medium transition-all disabled:opacity-50"
            disabled={isLoading || isLimitReached}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || isLimitReached}
            className="absolute right-2 top-2 bottom-2 bg-brand-primary text-brand-bg rounded-xl w-12 flex items-center justify-center hover:bg-emerald-400 transition-all disabled:bg-brand-surface disabled:text-slate-600 border border-transparent disabled:border-brand-border shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:shadow-none"
          >
            {isLimitReached ? <Lock size={18} className="ml-0.5 opacity-50" /> : <Send size={18} className="ml-0.5" />}
          </button>
        </form>
        {isPublicUser && isLimitReached && (
          <div className="mt-3 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-white bg-brand-primary hover:bg-emerald-500 px-4 py-2 rounded-lg transition-colors">
              <Lock size={14} /> Connexion Agent requise pour continuer
            </Link>
          </div>
        )}
        <div className="mt-4 text-center space-y-1.5">
          <p className="text-[10px] text-brand-primary/70 font-bold uppercase tracking-widest">
            Entraîné sur le code foncier congolais (Loi n° 73-021 modifiée)
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Les réponses sont générées par IA et ne remplacent pas l&apos;avis officiel d&apos;un Conservateur des Titres Immobiliers.
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
