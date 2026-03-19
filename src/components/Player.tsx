"use client";

import { useAudioEngine, AudioMode } from "@/lib/audio-engine";
import { useState, useEffect } from "react";

const MODES: { id: AudioMode; label: string; desc: string }[] = [
  { id: "speech_metronome", label: "Голос + Метроном", desc: "Оголошення хвилини мовчання та звук метроному" },
  { id: "metronome_only", label: "Тільки Метроном", desc: "Лише звук пам'яті" },
  { id: "speech_music", label: "Голос + Музика", desc: "Оголошення та урочисто-траурна мелодія" },
];

export default function Player() {
  const { timeLeft, isPlaying, toggleTestMode, audioMode, changeAudioMode } = useAudioEngine(9, 0);
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10">
      <div className="animate-pulse text-white/20 uppercase tracking-widest text-sm font-bold">
        Завантаження...
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] md:min-h-[75vh] text-center p-4 sm:p-6 md:p-12 bg-black/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] transition-all duration-700 w-full max-w-md mx-auto overflow-hidden">

      {/* Settings Toggle */}
      {!isPlaying && (
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="absolute top-4 right-4 p-3 text-white/60 hover:text-white/90 active:scale-95 transition-all z-30 bg-white/10 rounded-full backdrop-blur-xl border border-white/10 shadow-lg"
          aria-label="Налаштування"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      )}

      {showSettings && !isPlaying ? (
        <div className="w-full animate-in fade-in zoom-in-95 duration-300 z-10 px-2">
          <h2 className="text-xl md:text-2xl font-bold text-white/90 mb-6 md:mb-8 tracking-tight">Налаштування звуку</h2>        
          <div className="space-y-3 md:space-y-4 text-left">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  changeAudioMode(mode.id);
                  setShowSettings(false);
                }}
                className={`w-full p-4 md:p-5 rounded-3xl border transition-all active:scale-[0.97] ${
                  audioMode === mode.id
                    ? "bg-white/10 border-white/20 text-white shadow-xl shadow-white/5"
                    : "border-transparent text-white/40 hover:bg-white/5 hover:text-white/60"
                }`}
              >
                <div className="font-bold text-base md:text-lg">{mode.label}</div>
                <div className="text-[10px] md:text-xs opacity-50 mt-1 leading-relaxed">{mode.desc}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="mt-8 md:mt-10 text-white/30 hover:text-white/50 text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all p-4"
          >
            Закрити меню
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 md:mb-12 relative px-2">
            <div className={`absolute -inset-16 bg-yellow-500/10 rounded-full blur-[100px] transition-opacity duration-1000 ${isPlaying ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
            <h1 className="text-4xl xs:text-5xl md:text-6xl font-black bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent mb-3 md:mb-4 tracking-tighter leading-tight">
              Хвилина мовчання
            </h1>
            <p className="text-blue-400/80 text-base md:text-xl font-medium tracking-wide italic opacity-80">
              «Пам’ятаємо...»
            </p>
          </div>

          <div className="mb-8 md:mb-16 w-full">
            <div className="text-6xl xs:text-7xl sm:text-[5.5rem] md:text-[8rem] font-mono font-black text-white tracking-tighter tabular-nums drop-shadow-[0_10px_50px_rgba(255,255,255,0.2)] leading-none select-none">
              {isPlaying ? "00:00:00" : timeLeft}
            </div>
            <div className="flex items-center justify-center gap-3 md:gap-4 mt-6 md:mt-8">
              <span className="h-px w-6 md:w-8 bg-white/10"></span>
              <p className="text-white/40 text-[9px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.5em] font-black">
                {isPlaying ? "Йде хвилина пам'яті" : "До початку"}
              </p>
              <span className="h-px w-6 md:w-8 bg-white/10"></span>
            </div>
          </div>

          <div className="flex flex-col gap-6 md:gap-8 w-full px-2">
            <button
              onClick={toggleTestMode}
              className={`group relative overflow-hidden px-8 md:px-12 py-5 md:py-7 rounded-full font-black text-lg md:text-2xl transition-all duration-500 active:scale-90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] ${
                isPlaying
                ? "bg-red-600 text-white shadow-red-500/30"
                : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              <span className="relative z-10">{isPlaying ? "Зупинити" : "Запустити тест"}</span>
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-red-500 animate-pulse"></div>
              )}
            </button>

            {!isPlaying && (
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/5 rounded-full mx-auto border border-white/5 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-white/60 text-[9px] md:text-[10px] uppercase tracking-widest font-black">
                    {MODES.find(m => m.id === audioMode)?.label}
                  </span>
                </div>
                <p className="text-white/10 text-[8px] md:text-[9px] italic uppercase tracking-[0.2em] font-bold mt-2 px-4">
                  Автоматичний запуск о 9:00 щодня
                </p>
              </div>
            )}
          </div>

          {isPlaying && (
            <div className="mt-12 md:mt-20 flex items-end justify-center gap-1.5 md:gap-2 h-12 md:h-20">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 md:w-2 bg-yellow-400/90 rounded-full animate-wave shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: '100%',
                    animationDuration: audioMode === 'speech_music' ? '1.8s' : '0.9s'
                  }}
                ></div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
