"use client";

import { useEffect, useRef, useState } from "react";

export type AudioMode = "speech_metronome" | "metronome_only" | "speech_music";

// Helper to get absolute path for GitHub Pages
const getAudioPath = (filename: string) => {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  return `${origin}/hvylyna-movchannya/audio/${filename}`;
};

export const useAudioEngine = (targetHour: number = 9, targetMinute: number = 0) => {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>("speech_metronome");

  const currentAudio = useRef<HTMLAudioElement | null>(null);

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

  const playFile = (filename: string, loop: boolean = false): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(getAudioPath(filename));
      audio.loop = loop;
      currentAudio.current = audio;

      audio.play()
        .then(() => {
          if (loop) {
            resolve(); // If looping, we consider it "started"
          } else {
            audio.onended = () => resolve();
          }
        })
        .catch(err => {
          console.error(`Error playing ${filename}:`, err);
          reject(err);
        });
    });
  };

  const startPlayback = async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    try {
      if (audioMode === "metronome_only") {
        await playFile("metronome.mp3", true);
        setTimeout(stopPlayback, 60000);
      } else {
        // Voice + something
        try {
          // Play Voice FIRST and WAIT for it to end
          await playFile("intro.mp3", false);
        } catch (e) {
          console.warn("Voice failed, skipping to background", e);
        }

        // Only after voice ends (or fails), play background
        const bgFile = audioMode === "speech_music" ? "metronome_only.mp3" : "metronome.mp3";
        await playFile(bgFile, true);
        setTimeout(stopPlayback, 60000);
      }
    } catch (error) {
      console.error("Critical playback error:", error);
      stopPlayback();
    }
  };

  const stopPlayback = () => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.src = "";
      currentAudio.current = null;
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
