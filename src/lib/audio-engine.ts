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

      // We use different files based on availability
      introAudio.current = new Audio(`${BASE_PATH}/audio/intro.mp3`);
      metronomeAudio.current = new Audio(`${BASE_PATH}/audio/metronome.mp3`);
      // Warning: solemn_music.mp3 was 94 bytes (corrupted), using metronome_only.mp3 as fallback if needed
      musicAudio.current = new Audio(`${BASE_PATH}/audio/metronome_only.mp3`);

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
      // 1. Force unlock all audio by playing and immediately pausing
      // This is crucial for Safari on iPhone
      [introAudio.current, metronomeAudio.current, musicAudio.current].forEach(a => {
        if (a) {
          a.play().then(() => {
            a.pause();
            a.currentTime = 0;
          }).catch(() => {});
        }
      });

      if (audioMode === "metronome_only") {
        if (metronomeAudio.current) {
          metronomeAudio.current.loop = true;
          await metronomeAudio.current.play();
        }
        setTimeout(stopPlayback, 60000);
      } else {
        // Speech modes
        if (introAudio.current) {
          // Logic: First Speech, then Loop
          introAudio.current.onended = () => {
            const bgAudio = audioMode === "speech_music" ? musicAudio.current : metronomeAudio.current;
            if (bgAudio) {
              bgAudio.loop = true;
              bgAudio.play().catch(e => console.error("BG play failed", e));
            }
            // The whole process lasts 60s from the start of the background sound
            setTimeout(stopPlayback, 60000);
          };
          
          await introAudio.current.play();
        } else {
            // Fallback if intro failed
            setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error("Playback failed:", error);
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
