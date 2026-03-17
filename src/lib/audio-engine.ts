"use client";

import { useEffect, useRef, useState } from "react";

export const useAudioEngine = (targetHour: number = 9, targetMinute: number = 0) => {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  
  const introAudio = useRef<HTMLAudioElement | null>(null);
  const metronomeAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      introAudio.current = new Audio("/audio/intro.mp3");
      metronomeAudio.current = new Audio("/audio/metronome.mp3");
      
      introAudio.current.load();
      metronomeAudio.current.load();
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

      // Auto-trigger at 9:00:00
      if (diff <= 1000 && diff > 0 && !isPlaying && !isTestMode) {
        startPlayback();
      }
    };

    const timer = setInterval(checkTime, 1000);
    checkTime();

    return () => clearInterval(timer);
  }, [isPlaying, isTestMode, targetHour, targetMinute]);

  const startPlayback = async () => {
    setIsPlaying(true);
    
    if (!introAudio.current || !metronomeAudio.current) return;
    
    try {
      // Intro
      const playPromise = introAudio.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          introAudio.current!.onended = () => {
            metronomeAudio.current?.play().catch(e => console.warn("Metronome playback blocked", e));
            if (metronomeAudio.current) {
              metronomeAudio.current.loop = true;
              setTimeout(() => {
                stopPlayback();
              }, 60000);
            }
          };
        }).catch(error => {
          console.warn("Intro playback blocked or failed, but visual mode is active.", error);
          // Fallback: still show visual mode for 60 seconds even if audio fails
          setTimeout(() => {
            if (isPlaying) stopPlayback();
          }, 65000);
        });
      }
    } catch (error) {
      console.error("Playback logic failed:", error);
    }
  };

  const stopPlayback = () => {
    if (introAudio.current) {
      introAudio.current.pause();
      introAudio.current.currentTime = 0;
    }
    if (metronomeAudio.current) {
      metronomeAudio.current.pause();
      metronomeAudio.current.currentTime = 0;
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

  return { timeLeft, isPlaying, isTestMode, toggleTestMode, stopPlayback };
};
