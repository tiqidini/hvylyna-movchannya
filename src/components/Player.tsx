"use client";

import { useAudioEngine, AudioMode, IntroVariant } from "@/lib/audio-engine";
import { useState, useEffect } from "react";

const MODES: { id: AudioMode; label: string; desc: string }[] = [
  { id: "speech_metronome", label: "Голос + Метроном", desc: "Голосове оголошення та звук метроному" },
  { id: "metronome_only", label: "Тільки Метроном", desc: "Лише звук метроному пам'яті" },
  { id: "speech_music", label: "Голос + Музика", desc: "Голосове оголошення та урочиста мелодія" },
];

const INTRO_VARIANTS: { id: IntroVariant; label: string; desc: string }[] = [
  { id: "standard", label: "Варіант №1", desc: "Класичне оголошення (офіційне)" },
  { id: "alternative", label: "Варіант №2", desc: "Чистий голос (Українське Радіо)" },
];

export default function Player() {
  const { 
    timeLeft, 
    isPlaying, 
    isTestTimerEnabled,
    testHour,
    testMinute,
    setTestTimer,
    toggleTestTimer,
    toggleTestMode, 
    audioMode, 
    changeAudioMode,
    introVariant,
    changeIntroVariant
  } = useAudioEngine(9, 0);
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-black text-white">
      <div className="animate-pulse text-white/20 uppercase tracking-widest text-sm font-black">
        Завантаження...
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] max-w-lg mx-auto p-6 xs:p-8 bg-black overflow-hidden select-none">
      
      {/* Top Header Row - Fixed height to avoid jumps */}
      <div className="w-full flex justify-end items-center h-16 shrink-0">
        {!isPlaying && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-4 text-white/30 hover:text-white/80 active:scale-90 transition-all bg-white/5 rounded-full border border-white/5 shadow-lg"
            aria-label="Налаштування"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        )}
      </div>

      {showSettings && !isPlaying ? (
        <div className="w-full flex-grow flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 px-2">
          <h2 className="text-2xl xs:text-3xl font-black text-white mb-10 tracking-tight text-center">Звуковий супровід</h2>        
          <div className="space-y-4 text-left">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => changeAudioMode(mode.id)}
                className={`w-full p-6 rounded-[2rem] border transition-all active:scale-[0.97] ${
                  audioMode === mode.id
                    ? "bg-white/10 border-white/20 text-white shadow-2xl"
                    : "border-transparent text-white/30 hover:bg-white/5 hover:text-white/50"
                }`}
              >
                <div className="font-black text-lg">{mode.label}</div>
                <div className="text-xs opacity-50 mt-1.5 leading-relaxed font-medium">{mode.desc}</div>
              </button>
            ))}
          </div>

          <h2 className="text-xl font-black text-white mt-12 mb-6 tracking-tight text-center">Голос диктора</h2>
          <div className="grid grid-cols-2 gap-4">
            {INTRO_VARIANTS.map((variant) => (
              <button
                key={variant.id}
                onClick={() => changeIntroVariant(variant.id)}
                className={`p-4 rounded-[1.5rem] border transition-all active:scale-[0.97] ${
                  introVariant === variant.id
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                    : "border-white/5 text-white/20 hover:bg-white/5"
                }`}
              >
                <div className="font-black text-sm">{variant.label}</div>
                <div className="text-[9px] opacity-40 mt-1 font-medium">{variant.id === "standard" ? "3.9 MB" : "982 KB"}</div>
              </button>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-[2rem] bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-white">Тестовий режим</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Для перевірки спрацювання</p>
              </div>
              <button 
                onClick={() => toggleTestTimer(!isTestTimerEnabled)}
                className={`w-14 h-8 rounded-full transition-all duration-300 relative ${isTestTimerEnabled ? 'bg-blue-600' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 ${isTestTimerEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
            
            {isTestTimerEnabled && (
              <div className="flex items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex-grow grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-black ml-2">Година</label>
                    <input 
                      type="number" 
                      min="0" max="23" 
                      value={testHour} 
                      onChange={(e) => setTestTimer(parseInt(e.target.value) || 0, testMinute)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white font-mono font-bold text-center outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-black ml-2">Хвилина</label>
                    <input 
                      type="number" 
                      min="0" max="59" 
                      value={testMinute} 
                      onChange={(e) => setTestTimer(testHour, parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white font-mono font-bold text-center outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowSettings(false)}
            className="mt-14 text-white/20 hover:text-white/50 text-[10px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all p-4 text-center"
          >
            Закрити меню
          </button>
        </div>
      ) : (
        <>
          {/* Top Title Section */}
          <div className="text-center w-full px-2 mt-2 shrink-0">
            <h1 className="text-4xl xs:text-5xl font-black bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent mb-2 tracking-tighter leading-tight">
              Хвилина мовчання
            </h1>
            <p className="text-blue-500/60 text-sm xs:text-base font-black tracking-[0.3em] uppercase">
              Пам’ятаємо
            </p>
          </div>

          {/* Center Timer Section - Takes available space */}
          <div className="flex-grow flex flex-col items-center justify-center w-full py-10">
            <div className="text-7xl xs:text-8xl sm:text-[7rem] font-mono font-black text-white tracking-tighter tabular-nums leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              {isPlaying ? "00:00:00" : timeLeft}
            </div>
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className="h-px w-8 bg-white/10"></span>
              <p className="text-white/20 text-[10px] uppercase tracking-[0.6em] font-black">
                {isPlaying ? "Йде хвилина пам'яті" : "До початку"}
              </p>
              <span className="h-px w-8 bg-white/10"></span>
            </div>
          </div>

          {/* Bottom Controls Section */}
          <div className="w-full px-2 mb-8 shrink-0">
            <button
              onClick={toggleTestMode}
              className={`w-full relative overflow-hidden py-7 rounded-full font-black text-xl transition-all duration-500 active:scale-95 shadow-2xl ${
                isPlaying
                ? "bg-red-600 text-white shadow-red-500/30"
                : "bg-white text-black hover:bg-gray-50"
              }`}
            >
              <span className="relative z-10">{isPlaying ? "Зупинити" : "Запустити тест"}</span>
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-red-500 animate-pulse"></div>
              )}
            </button>

            {!isPlaying && (
              <div className="flex flex-col gap-4 mt-10 items-center">
                <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-black">
                    {MODES.find(m => m.id === audioMode)?.label}
                  </span>
                </div>
                <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.4em] mt-2">
                  {isTestTimerEnabled ? `Тест о ${testHour.toString().padStart(2, '0')}:${testMinute.toString().padStart(2, '0')}` : "Автоматично о 9:00"}
                </p>
              </div>
            )}
          </div>

          {/* Visual Indicator Layer */}
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden pointer-events-none">
              <div className="h-full bg-white/40 animate-progress origin-left w-full"></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
