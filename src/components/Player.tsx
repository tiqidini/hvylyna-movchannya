"use client";

import { useAudioEngine, AudioMode } from "@/lib/audio-engine";
import { useState, useEffect } from "react";

const MODES: { id: AudioMode; label: string; desc: string }[] = [
  { id: "speech_metronome", label: "Голос + Метроном", desc: "Оголошення хвилини мовчання та звук метроному" },
  { id: "metronome_only", label: "Тільки Метроном", desc: "Лише звук пам'яті" },
  { id: "speech_music", label: "Голос + Музика", desc: "Оголошення та урочиста мелодія" },
];

export default function Player() {
  const { timeLeft, isPlaying, toggleTestMode, audioMode, changeAudioMode } = useAudioEngine(9, 0);
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10">
      <div className="animate-pulse text-white/20 uppercase tracking-widest text-sm font-bold">
        Завантаження...
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col items-center justify-between min-h-[85vh] sm:min-h-[80vh] text-center p-6 xs:p-8 sm:p-12 bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-white/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.9)] transition-all duration-700 w-full max-w-lg mx-auto overflow-hidden">

      {/* Settings Toggle */}
      {!isPlaying && (
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="absolute top-6 right-6 p-4 text-white/40 hover:text-white/90 active:scale-90 transition-all z-30 bg-white/5 rounded-full backdrop-blur-xl border border-white/5 shadow-lg"
          aria-label="Налаштування"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      )}

      {showSettings && !isPlaying ? (
        <div className="w-full flex-grow flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500 z-10 px-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-10 tracking-tight">Звуковий супровід</h2>        
          <div className="space-y-4 text-left">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  changeAudioMode(mode.id);
                  setShowSettings(false);
                }}
                className={`w-full p-6 rounded-[2rem] border transition-all active:scale-[0.97] ${
                  audioMode === mode.id
                    ? "bg-white/10 border-white/20 text-white shadow-2xl shadow-white/5"
                    : "border-transparent text-white/40 hover:bg-white/5 hover:text-white/60"
                }`}
              >
                <div className="font-bold text-lg md:text-xl">{mode.label}</div>
                <div className="text-xs md:text-sm opacity-50 mt-1.5 leading-relaxed">{mode.desc}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="mt-12 text-white/20 hover:text-white/50 text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all p-4"
          >
            Повернутися
          </button>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="mt-4 md:mt-8 relative w-full px-2">
            <div className={`absolute -inset-20 bg-blue-500/5 rounded-full blur-[120px] transition-opacity duration-1000 ${isPlaying ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
            <h1 className="text-4xl xs:text-5xl md:text-6xl font-black bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent mb-4 tracking-tighter leading-tight">
              Хвилина мовчання
            </h1>
            <p className="text-blue-400/60 text-lg md:text-xl font-medium tracking-[0.2em] uppercase opacity-80">
              Пам’ятаємо
            </p>
          </div>

          {/* Main Timer Section */}
          <div className="my-12 flex-grow flex flex-col justify-center w-full">
            <div className="text-7xl xs:text-8xl sm:text-[6.5rem] md:text-[9rem] font-mono font-black text-white tracking-tighter tabular-nums drop-shadow-[0_10px_60px_rgba(255,255,255,0.15)] leading-none select-none">
              {isPlaying ? "00:00:00" : timeLeft}
            </div>
            <div className="flex items-center justify-center gap-4 mt-10">
              <span className="h-px w-10 bg-white/10"></span>
              <p className="text-white/30 text-[10px] md:text-xs uppercase tracking-[0.5em] font-black">
                {isPlaying ? "Йде хвилина пам'яті" : "До початку"}
              </p>
              <span className="h-px w-10 bg-white/10"></span>
            </div>
          </div>

          {/* Controls Section */}
          <div className="mb-6 md:mb-10 flex flex-col gap-10 w-full px-2">
            <button
              onClick={toggleTestMode}
              className={`group relative overflow-hidden px-10 md:px-14 py-6 md:py-8 rounded-full font-black text-xl md:text-2xl transition-all duration-500 active:scale-95 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] ${
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
              <div className="flex flex-col gap-4">
                <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white/5 rounded-full mx-auto border border-white/5 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
                    {MODES.find(m => m.id === audioMode)?.label}
                  </span>
                </div>
                <p className="text-white/10 text-[9px] md:text-[10px] italic uppercase tracking-[0.3em] font-bold mt-2">
                  Автоматичний запуск о 9:00
                </p>
              </div>
            )}
          </div>

          {/* Visualizer (Only when playing) */}
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1.5 h-32 opacity-20 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 md:w-1.5 bg-white rounded-t-full animate-wave"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    height: `${Math.random() * 100}%`,
                    animationDuration: '1s'
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
