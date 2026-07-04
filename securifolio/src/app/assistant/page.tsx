"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, ShieldAlert, Bot } from "lucide-react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      if (!res.ok) throw new Error("Erreur de connexion au serveur");

      const data = await res.json();
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue lors de la connexion au serveur." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-white dark:bg-slate-950/20 border-x border-slate-200 dark:border-slate-900 shadow-sm relative overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800/80 p-4 flex items-center justify-between shadow-sm relative z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-slate-105 dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850">
            <Bot size={22} className="text-[#F7D618]" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-slate-800 dark:text-white text-base tracking-tight">
              Assistant Foncier RDC
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 mt-0.5">
              <ShieldAlert size={12} className="text-emerald-500" />
              Verrou d&apos;intégrité légale activé (Loi n° 25/062)
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-800 ${msg.role === "user" ? "bg-[#007FFF] text-white" : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-white"}`}>
                {msg.role === "user" ? <User size={15} /> : <Bot size={15} className="text-[#F7D618]" />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === "user" 
                  ? "bg-blue-50 dark:bg-[#007FFF]/20 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-[#007FFF]/30 rounded-tr-sm" 
                  : "bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-slate-100 rounded-tl-sm"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 flex-shrink-0 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-white flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-800">
                <Bot size={15} className="text-[#F7D618]" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm rounded-tl-sm flex items-center h-12">
                <div className="flex gap-1.5 px-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 relative z-10">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question sur la législation foncière..."
            className="flex-1 border border-slate-200 dark:border-slate-800 rounded-full py-3.5 px-6 pr-14 focus:outline-none focus:ring-2 focus:ring-[#007FFF] focus:border-transparent text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-full w-10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-650 border border-slate-300 dark:border-slate-750"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </form>
        <div className="mt-4 text-center space-y-1">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            L&apos;Assistant Foncier-Édu est entraîné sur le code foncier congolais (Loi n° 73-021 modifiée par la Loi n° 25/062 du 25 mars 2025).
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Les réponses sont générées par IA et ne remplacent pas l&apos;avis officiel d&apos;un Conservateur des Titres Immobiliers ou d&apos;un avocat.
          </p>
        </div>
      </div>
    </div>
  );
}
