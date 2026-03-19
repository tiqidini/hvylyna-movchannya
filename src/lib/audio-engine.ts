"use client";

import { useEffect, useRef, useState } from "react";

export type AudioMode = "speech_metronome" | "metronome_only" | "speech_music";

const BASE_PATH = "/hvylyna-movchannya";

export const useAudioEngine = (targetHour: number = 9, targetMinute: number = 0) => {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>("speech_metronome");

  const introAudio = useRef<HTMLAudioElement | null>(null);
  const metronomeAudio = useRef<HTMLAudioElement | null>(null);
  const musicAudio = useRef<HTMLAudioElement | null>(null);

  // Initialize audio objects
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("hvylyna_audio_mode") as AudioMode;
      if (savedMode) setAudioMode(savedMode);

      introAudio.current = new Audio(`${BASE_PATH}/audio/intro.mp3`);
      metronomeAudio.current = new Audio(`${BASE_PATH}/audio/metronome.mp3`);
      musicAudio.current = new Audio(`${BASE_PATH}/audio/solemn_music.mp3`);

      const allAudio = [introAudio.current, metronomeAudio.current, musicAudio.current];
      allAudio.forEach(audio => {
        if (audio) {
          audio.preload = "auto";
          audio.load();
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

      // Trigger at exactly 09:00:00
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
    setIsPlaying(true);

    try {
      // Small silent play to unlock audio on iOS if needed
      // but we expect this to be called from a user interaction (button click)
      
      if (audioMode === "metronome_only") {
        if (metronomeAudio.current) {
          metronomeAudio.current.loop = true;
          await metronomeAudio.current.play();
        }
        setTimeout(stopPlayback, 60000);
      } else {
        if (introAudio.current) {
          introAudio.current.onended = () => {
            const bgAudio = audioMode === "speech_music" ? musicAudio.current : metronomeAudio.current;
            if (bgAudio) {
              bgAudio.loop = true;
              bgAudio.play().catch(e => console.error("BG play failed", e));
              setTimeout(stopPlayback, 60000);
            }
          };
          await introAudio.current.play();
        }
      }
    } catch (error) {
      console.error("Playback failed:", error);
      // In case of total failure, still show the visual state for 60s
      setTimeout(stopPlayback, 60000);
    }
  };

  const stopPlayback = () => {
    [introAudio, metronomeAudio, musicAudio].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
        ref.current.onended = null;
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
