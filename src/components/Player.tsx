"use client";

import { useAudioEngine, AudioMode } from "@/lib/audio-engine";
import { useState, useEffect } from "react";

const MODES: { id: AudioMode; label: string; desc: string }[] = [
  { id: "speech_metronome", label: "Голос + Метроном", desc: "Оголошення хвилини мовчання та звук метроному" },
  { id: "metronome_only", label: "Тільки Метроном", desc: "Лише звук пам'яті" },
  { id: "speech_music", label: "Голос + Музика", desc: "Оголошення та метроном пам'яті" },
];

export default function Player() {
  const { timeLeft, isPlaying, toggleTestMode, audioMode, changeAudioMode } = useAudioEngine(9, 0);
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6">
      <div className="animate-pulse text-white/20 uppercase tracking-widest text-sm font-bold">
        Завантаження...
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-between w-full min-h-[100dvh] max-w-lg mx-auto p-6 xs:p-8 bg-black overflow-hidden safe-area-padding">
      
      {/* Top Header Row */}
      <div className="w-full flex justify-end items-center h-12">
        {!isPlaying && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 text-white/40 hover:text-white/90 active:scale-90 transition-all bg-white/5 rounded-full border border-white/5"
            aria-label="Налаштування"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        )}
      </div>

      {showSettings && !isPlaying ? (
        <div className="w-full flex-grow flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500 z-10">
          <h2 className="text-2xl font-bold text-white/90 mb-8 tracking-tight text-center">Звуковий супровід</h2>        
          <div className="space-y-4 text-left">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  changeAudioMode(mode.id);
                  setShowSettings(false);
                }}
                className={`w-full p-5 rounded-[1.5rem] border transition-all active:scale-[0.97] ${
                  audioMode === mode.id
                    ? "bg-white/10 border-white/20 text-white shadow-xl"
                    : "border-transparent text-white/40 hover:bg-white/5 hover:text-white/60"
                }`}
              >
                <div className="font-bold text-lg">{mode.label}</div>
                <div className="text-xs opacity-50 mt-1 leading-relaxed">{mode.desc}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="mt-12 text-white/20 hover:text-white/50 text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all p-4"
          >
            Закрити меню
          </button>
        </div>
      ) : (
        <>
          {/* Main Content Area */}
          <div className="flex-grow flex flex-col items-center justify-around w-full">
            
            {/* Header */}
            <div className="relative text-center w-full px-2 mt-4">
              <h1 className="text-4xl xs:text-5xl font-black bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent mb-3 tracking-tighter leading-tight">
                Хвилина мовчання
              </h1>
              <p className="text-blue-400/60 text-base font-medium tracking-[0.2em] uppercase opacity-80">
                Пам’ятаємо
              </p>
            </div>

            {/* Timer */}
            <div className="w-full text-center">
              <div className="text-6xl xs:text-7xl sm:text-[6rem] font-mono font-black text-white tracking-tighter tabular-nums leading-none select-none drop-shadow-2xl">
                {isPlaying ? "00:00:00" : timeLeft}
              </div>
              <div className="flex items-center justify-center gap-4 mt-8">
                <span className="h-px w-8 bg-white/10"></span>
                <p className="text-white/30 text-[10px] uppercase tracking-[0.5em] font-black">
                  {isPlaying ? "Йде хвилина пам'яті" : "До початку"}
                </p>
                <span className="h-px w-8 bg-white/10"></span>
              </div>
            </div>

            {/* Controls */}
            <div className="w-full px-2">
              <button
                onClick={toggleTestMode}
                className={`w-full relative overflow-hidden py-6 rounded-full font-black text-xl transition-all duration-500 active:scale-95 shadow-2xl ${
                  isPlaying
                  ? "bg-red-600 text-white shadow-red-500/20"
                  : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                <span className="relative z-10">{isPlaying ? "Зупинити" : "Запустити тест"}</span>
                {isPlaying && (
                  <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-red-500 animate-pulse"></div>
                )}
              </button>

              {!isPlaying && (
                <div className="flex flex-col gap-4 mt-8 items-center">
                  <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-black">
                      {MODES.find(m => m.id === audioMode)?.label}
                    </span>
                  </div>
                  <p className="text-white/10 text-[9px] italic uppercase tracking-[0.3em] font-bold mt-2">
                    Автоматичний запуск о 9:00
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Spacer for bottom */}
          <div className="h-12 w-full flex items-center justify-center">
             {isPlaying && (
               <div className="flex items-center gap-1.5 h-6">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="w-1 bg-white/40 rounded-full animate-wave h-full" style={{animationDelay: `${i*0.1}s`}}></div>
                 ))}
               </div>
             )}
          </div>
        </>
      )}
    </div>
  );
}
