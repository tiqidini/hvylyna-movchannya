"use client";

import { useEffect, useRef, useState } from "react";

export type AudioMode = "speech_metronome" | "metronome_only" | "speech_music";

// Helper to get absolute path for GitHub Pages
const getAudioPath = (filename: string) => {
  return `/hvylyna-movchannya/audio/${filename}`;
};

export const useAudioEngine = (targetHour: number = 9, targetMinute: number = 0) => {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>("speech_metronome");

  const introAudio = useRef<HTMLAudioElement | null>(null);
  const metronomeAudio = useRef<HTMLAudioElement | null>(null);
  const musicAudio = useRef<HTMLAudioElement | null>(null);
  
  // Audio state tracking
  const audioModeRef = useRef(audioMode);
  useEffect(() => { audioModeRef.current = audioMode; }, [audioMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("hvylyna_audio_mode") as AudioMode;
      if (savedMode) setAudioMode(savedMode);

      introAudio.current = new Audio(getAudioPath("intro.mp3"));
      metronomeAudio.current = new Audio(getAudioPath("metronome.mp3"));
      musicAudio.current = new Audio(getAudioPath("metronome_only.mp3"));

      // Setup transition handlers once
      introAudio.current.onended = () => {
        const mode = audioModeRef.current;
        const bgAudio = mode === "speech_music" ? musicAudio.current : metronomeAudio.current;
        if (bgAudio) {
          bgAudio.loop = true;
          bgAudio.play().catch(e => console.warn("Background audio blocked", e));
        }
        // Background runs for 60 seconds
        setTimeout(() => stopPlayback(), 60000);
      };

      [introAudio, metronomeAudio, musicAudio].forEach(ref => {
        if (ref.current) {
          ref.current.load();
          ref.current.preload = "auto";
        }
      });
    }
  }, []);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(targetHour, targetMinute, 0, 0);

      if (now > target) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );

      if (diff <= 1000 && diff > 0 && !isPlaying && !isTestMode) {
        startPlayback();
      }
    };

    const timer = setInterval(checkTime, 1000);
    checkTime();
    return () => clearInterval(timer);
  }, [isPlaying, isTestMode, targetHour, targetMinute]);

  const changeAudioMode = (mode: AudioMode) => {
    setAudioMode(mode);
    localStorage.setItem("hvylyna_audio_mode", mode);
  };

  const startPlayback = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    
    try {
      if (audioMode === "metronome_only") {
        if (metronomeAudio.current) {
          metronomeAudio.current.loop = true;
          await metronomeAudio.current.play();
        }
        setTimeout(stopPlayback, 60000);
      } else {
        // Speech modes - always start with intro
        if (introAudio.current) {
          introAudio.current.currentTime = 0;
          await introAudio.current.play();
        }
      }
    } catch (error) {
      console.error("Playback failed:", error);
      // Fallback for UI if audio fails
      setTimeout(stopPlayback, 60000);
    }
  };

  const stopPlayback = () => {
    [introAudio, metronomeAudio, musicAudio].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    setIsPlaying(false);
    setIsTestMode(false);
  };

  const toggleTestMode = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      setIsTestMode(true);
      startPlayback();
    }
  };

  return { timeLeft, isPlaying, isTestMode, toggleTestMode, stopPlayback, audioMode, changeAudioMode };
};
