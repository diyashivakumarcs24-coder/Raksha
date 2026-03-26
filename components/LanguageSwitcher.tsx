"use client";
import { useState, useRef, useEffect } from "react";
import { LANGUAGES, Lang, saveLang } from "@/lib/i18n";

interface Props {
  current: Lang;
  onChange: (lang: Lang) => void;
}

export default function LanguageSwitcher({ current, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (lang: Lang) => {
    saveLang(lang);
    onChange(lang);
    setOpen(false);
  };

  const currentLang = LANGUAGES.find((l) => l.code === current);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs bg-gray-800 border border-gray-700 px-2.5 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-700 transition-colors"
        aria-label="Switch language"
      >
        <span>🌐</span>
        <span className="text-gray-300">{currentLang?.native ?? "EN"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden min-w-[140px]">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => select(lang.code)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                current === lang.code
                  ? "bg-purple-900/50 text-purple-300"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span>{lang.native}</span>
              {current === lang.code && <span className="text-purple-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
