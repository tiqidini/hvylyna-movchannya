"use client";

import { useAudioEngine } from "@/lib/audio-engine";
import { useState, useEffect } from "react";

export default function Player() {
  const { timeLeft, isPlaying, toggleTestMode } = useAudioEngine(9, 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent mb-2 tracking-tight">
          Хвилина мовчання
        </h1>
        <div className="text-7xl md:text-8xl font-mono font-black text-white/10 tracking-widest tabular-nums">
          00:00:00
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl transition-all duration-700 ease-in-out hover:scale-[1.02]">
      <div className="mb-8 relative">
        <div className={`absolute -inset-4 bg-yellow-500/20 rounded-full blur-2xl transition-opacity duration-1000 ${isPlaying ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent mb-2 tracking-tight">
          Хвилина мовчання
        </h1>
        <p className="text-white/60 text-lg font-light">Загальнонаціональна акція пам'яті</p>
      </div>

      <div className="mb-12">
        <div className="text-7xl md:text-8xl font-mono font-black text-white tracking-widest tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] min-h-[1em]">
          {isPlaying ? "00:00:00" : timeLeft}
        </div>
        <p className="text-blue-400 mt-4 text-sm uppercase tracking-[0.3em] font-semibold opacity-80">
          {isPlaying ? "ЙДЕ ВШАНУВАННЯ" : "ДО ПОЧАТКУ"}
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={toggleTestMode}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-500 active:scale-95 shadow-lg ${
            isPlaying 
            ? "bg-red-500/80 text-white hover:bg-red-600 shadow-red-500/20" 
            : "bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md"
          }`}
        >
          {isPlaying ? "ЗУПИНИТИ" : "ТЕСТОВИЙ РЕЖИМ"}
        </button>

        {!isPlaying && (
          <p className="text-white/40 text-xs italic">
            Додаток автоматично увімкне запис о 9:00 ранку
          </p>
        )}
      </div>

      {isPlaying && (
        <div className="mt-12 flex items-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="w-1.5 h-8 bg-yellow-500 rounded-full animate-wave"
              style={{ animationDelay: `${i * 0.15}s` }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}
