"use client";

import { useEffect, useRef, useState } from "react";

export type AudioMode = "speech_metronome" | "metronome_only" | "speech_music";

export const useAudioEngine = (targetHour: number = 9, targetMinute: number = 0) => {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>("speech_metronome");
  
  const introAudio = useRef<HTMLAudioElement | null>(null);
  const metronomeAudio = useRef<HTMLAudioElement | null>(null);
  const musicAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load preference
      const savedMode = localStorage.getItem("hvylyna_audio_mode") as AudioMode;
      if (savedMode) setAudioMode(savedMode);

      introAudio.current = new Audio("/audio/intro.mp3");
      metronomeAudio.current = new Audio("/audio/metronome.mp3");
      musicAudio.current = new Audio("/audio/solemn_music.mp3");
      
      [introAudio, metronomeAudio, musicAudio].forEach(ref => ref.current?.load());
    }
    
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
    setIsPlaying(true);
    
    try {
      if (audioMode === "metronome_only") {
        await metronomeAudio.current?.play();
        if (metronomeAudio.current) metronomeAudio.current.loop = true;
        setTimeout(stopPlayback, 60000);
      } else {
        // Speech modes
        const playPromise = introAudio.current?.play();
        if (playPromise) {
          playPromise.then(() => {
            introAudio.current!.onended = () => {
              const bgAudio = audioMode === "speech_music" ? musicAudio.current : metronomeAudio.current;
              bgAudio?.play().catch(e => console.warn("Background audio blocked", e));
              if (bgAudio) {
                bgAudio.loop = true;
                setTimeout(stopPlayback, 60000);
              }
            };
          }).catch(error => {
            console.warn("Speech playback blocked, forcing visual mode", error);
            setTimeout(stopPlayback, 65000);
          });
        }
      }
    } catch (error) {
      console.error("Playback failed:", error);
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
