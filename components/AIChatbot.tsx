"use client";
/**
 * AIChatbot — Gemini-powered safety assistant.
 * Uses /api/chat proxy to keep API key server-side.
 * Provides safety advice, emotional support, next steps.
 */
import { useState, useRef, useEffect } from "react";
import { Lang, t } from "@/lib/i18n";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const QUICK_PROMPTS = [
  "I'm being followed, what should I do?",
  "I feel unsafe right now",
  "How do I use pepper spray?",
  "I need to escape quickly",
];

interface Props { lang: Lang }

export default function AIChatbot({ lang }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I'm your Raksha safety assistant. I'm here to help with safety advice, emotional support, and guidance. How can I help you right now?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply ?? "I'm here for you. Please stay safe and call emergency services if needed." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I'm having trouble connecting. If you're in danger, call 100 (Police) or 1091 (Women Helpline) immediately." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded-2xl overflow-hidden border border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2 bg-gray-900">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm">🤖</div>
        <div>
          <p className="text-white text-sm font-semibold">{t(lang, "aiChatbot")}</p>
          <p className="text-green-400 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
            Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0" style={{ maxHeight: "320px" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-purple-600 text-white rounded-br-sm"
                : "bg-gray-800 text-gray-200 rounded-bl-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-sm">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-3 py-2 flex gap-2 overflow-x-auto border-t border-gray-800">
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => sendMessage(p)}
            className="flex-shrink-0 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 flex gap-2 border-t border-gray-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder={t(lang, "typeMessage")}
          className="flex-1 bg-gray-800 text-white rounded-xl px-3 py-2 text-sm border border-gray-700 focus:border-purple-500 focus:outline-none placeholder-gray-600"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          {t(lang, "send")}
        </button>
      </div>
    </div>
  );
}
