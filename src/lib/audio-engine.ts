"use client";

import { useEffect, useRef, useState } from "react";

export type AudioMode = "speech_metronome" | "metronome_only" | "speech_music";

const BASE_PATH = "/hvylyna-movchannya";

export const useAudioEngine = (targetHour: number = 9, targetMinute: number = 0) => {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>("speech_metronome");

  // Use a single ref for the active audio to prevent overlaps
  const activeAudio = useRef<HTMLAudioElement | null>(null);
  const secondaryAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("hvylyna_audio_mode") as AudioMode;
      if (savedMode) setAudioMode(savedMode);
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
  }, [isPlaying, isTestMode, targetHour, targetMinute, audioMode]);

  const changeAudioMode = (mode: AudioMode) => {
    setAudioMode(mode);
    localStorage.setItem("hvylyna_audio_mode", mode);
  };

  const startPlayback = async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    try {
      if (audioMode === "metronome_only") {
        const audio = new Audio(`${BASE_PATH}/audio/metronome.mp3`);
        audio.loop = true;
        activeAudio.current = audio;
        await audio.play();
        setTimeout(stopPlayback, 60000);
      } else {
        // Mode with Voice
        const intro = new Audio(`${BASE_PATH}/audio/intro.mp3`);
        activeAudio.current = intro;

        intro.onended = async () => {
          // Determine next sound
          const nextFile = audioMode === "speech_music" 
            ? `${BASE_PATH}/audio/metronome_only.mp3` // Fallback for corrupted music
            : `${BASE_PATH}/audio/metronome.mp3`;
            
          const bg = new Audio(nextFile);
          bg.loop = true;
          secondaryAudio.current = bg;
          await bg.play();
          setTimeout(stopPlayback, 60000);
        };

        await intro.play();
      }
    } catch (error) {
      console.error("Playback failed:", error);
      // Ensure we don't get stuck in playing state if audio fails
      setTimeout(stopPlayback, 5000); 
    }
  };

  const stopPlayback = () => {
    if (activeAudio.current) {
      activeAudio.current.pause();
      activeAudio.current.onended = null;
      activeAudio.current = null;
    }
    if (secondaryAudio.current) {
      secondaryAudio.current.pause();
      secondaryAudio.current = null;
    }
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
