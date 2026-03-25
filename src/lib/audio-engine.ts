"use client";

import { useEffect, useRef, useState } from "react";

export type AudioMode = "speech_metronome" | "metronome_only" | "speech_music";
export type IntroVariant = "standard" | "alternative";

// Helper to get path for audio assets
const getAudioPath = (filename: string) => {
  if (typeof window === "undefined") return "";
  // Using relative path without leading slash makes it robust to basePath settings
  return `audio/${filename}`;
};

export const useAudioEngine = (targetHour: number = 9, targetMinute: number = 0) => {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>("speech_metronome");
  const [introVariant, setIntroVariant] = useState<IntroVariant>("standard");
  
  // Test Mode state
  const [isTestTimerEnabled, setIsTestTimerEnabled] = useState(false);
  const [testHour, setTestHour] = useState(9);
  const [testMinute, setTestMinute] = useState(1);
  const [hasTriggeredToday, setHasTriggeredToday] = useState(false);

  const introAudio = useRef<HTMLAudioElement | null>(null);
  const metronomeAudio = useRef<HTMLAudioElement | null>(null);
  const musicAudio = useRef<HTMLAudioElement | null>(null);
  const lastTriggerDate = useRef<string>("");
  const isUnlocked = useRef(false);
  
  // Audio state tracking
  const audioModeRef = useRef(audioMode);
  useEffect(() => { audioModeRef.current = audioMode; }, [audioMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("hvylyna_audio_mode") as AudioMode;
      if (savedMode) setAudioMode(savedMode);

      const savedVariant = localStorage.getItem("hvylyna_intro_variant") as IntroVariant;
      if (savedVariant) setIntroVariant(savedVariant);

      const savedTestHour = localStorage.getItem("hvylyna_test_hour");
      if (savedTestHour) setTestHour(parseInt(savedTestHour));

      const savedTestMin = localStorage.getItem("hvylyna_test_minute");
      if (savedTestMin) setTestMinute(parseInt(savedTestMin));

      const savedTestEnabled = localStorage.getItem("hvylyna_test_enabled");
      if (savedTestEnabled === "true") setIsTestTimerEnabled(true);

      const introPath = getAudioPath("intro.mp3");
      const metronomePath = getAudioPath("metronome.mp3");
      const musicPath = getAudioPath("metronome_only.mp3"); // Using this as solemn music if solemn_music.mp3 is placeholder

      console.log("Audio Paths:", { introPath, metronomePath, musicPath });

      introAudio.current = new Audio(introPath);
      metronomeAudio.current = new Audio(metronomePath);
      musicAudio.current = new Audio(musicPath);

      // Setup transition handlers once
      introAudio.current.onended = () => {
        const mode = audioModeRef.current;
        console.log("Intro ended, starting background mode:", mode);
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

  // Sync intro variant to audio object
  useEffect(() => {
    if (typeof window !== "undefined" && introAudio.current) {
      const filename = introVariant === "standard" ? "intro.mp3" : "intro_alt.m4a";
      introAudio.current.src = getAudioPath(filename);
      introAudio.current.load();
    }
  }, [introVariant]);

  useEffect(() => {
    const checkTime = () => {
      // Get current time in Kyiv
      const now = new Date();
      const kyivTimeStr = now.toLocaleString("en-US", { timeZone: "Europe/Kyiv" });
      const kyivNow = new Date(kyivTimeStr);
      const kyivTodayStr = kyivNow.toDateString();

      // Reset trigger if day changed
      if (lastTriggerDate.current !== kyivTodayStr) {
        setHasTriggeredToday(false);
      }

      // 1. Calculate main 09:00 trigger (Kyiv time)
      const target = new Date(kyivTimeStr);
      target.setHours(targetHour, targetMinute, 0, 0);

      // 2. Calculate test trigger if enabled
      let testTarget: Date | null = null;
      if (isTestTimerEnabled) {
        testTarget = new Date(kyivTimeStr);
        testTarget.setHours(testHour, testMinute, 0, 0);
      }

      // Determine which target is next or current
      let activeTarget = target;
      if (testTarget && (testTarget > kyivNow || (testTarget <= kyivNow && testTarget.getTime() + 60000 > kyivNow.getTime()))) {
         // If test is set and either in future OR just passed within last minute, show countdown to it
         if (testTarget > kyivNow) activeTarget = testTarget;
      } else if (target <= kyivNow) {
        target.setDate(target.getDate() + 1);
        activeTarget = target;
      }

      const diff = activeTarget.getTime() - kyivNow.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );

      // TRIGGER LOGIC
      // We trigger if: now >= target AND it's within the same minute AND hasn't triggered today yet
      const shouldTriggerMain = 
        kyivNow >= new Date(new Date(kyivTimeStr).setHours(targetHour, targetMinute, 0, 0)) && 
        kyivNow.getTime() < new Date(new Date(kyivTimeStr).setHours(targetHour, targetMinute, 0, 0)).getTime() + 5000 &&
        lastTriggerDate.current !== kyivTodayStr;

      const shouldTriggerTest = 
        isTestTimerEnabled &&
        kyivNow >= new Date(new Date(kyivTimeStr).setHours(testHour, testMinute, 0, 0)) &&
        kyivNow.getTime() < new Date(new Date(kyivTimeStr).setHours(testHour, testMinute, 0, 0)).getTime() + 5000 &&
        lastTriggerDate.current !== kyivTodayStr + "_test";

      if ((shouldTriggerMain || shouldTriggerTest) && !isPlaying) {
        console.log("TRIGGERED! Main:", shouldTriggerMain, "Test:", shouldTriggerTest);
        lastTriggerDate.current = shouldTriggerTest ? kyivTodayStr + "_test" : kyivTodayStr;
        setHasTriggeredToday(true);
        startPlayback();
      }
    };

    const timer = setInterval(checkTime, 1000);
    checkTime();
    return () => clearInterval(timer);
  }, [isPlaying, isTestTimerEnabled, targetHour, targetMinute, testHour, testMinute]);

  const changeAudioMode = (mode: AudioMode) => {
    setAudioMode(mode);
    localStorage.setItem("hvylyna_audio_mode", mode);
  };

  const changeIntroVariant = (variant: IntroVariant) => {
    setIntroVariant(variant);
    localStorage.setItem("hvylyna_intro_variant", variant);
  };

  const startPlayback = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    
    try {
      if (audioMode === "metronome_only") {
        if (metronomeAudio.current) {
          console.log("Starting metronome only...");
          metronomeAudio.current.loop = true;
          await metronomeAudio.current.play();
        }
        setTimeout(stopPlayback, 60000);
      } else {
        // Speech modes - always start with intro
        if (introAudio.current) {
          console.log("Starting intro speech...");
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
    console.log("Stopping playback...");
    [introAudio, metronomeAudio, musicAudio].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    setIsPlaying(false);
  };

  const unlockAudio = async () => {
    if (isUnlocked.current) return;
    console.log("Attempting to unlock audio for iOS...");
    
    const prime = async (audio: HTMLAudioElement | null) => {
      if (!audio) return;
      try {
        // Play silent or low volume to unlock
        const originalVolume = audio.volume;
        audio.volume = 0;
        await audio.play();
        audio.pause();
        audio.volume = originalVolume;
        console.log("Audio object unlocked:", audio.src.split('/').pop());
      } catch (e) {
        console.error("Unlock failed for audio object:", e);
      }
    };

    await Promise.all([
      prime(introAudio.current),
      prime(metronomeAudio.current),
      prime(musicAudio.current)
    ]);
    
    isUnlocked.current = true;
    console.log("Audio system unlocked for this session.");
  };

  const toggleTestMode = async () => {
    await unlockAudio();
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const setTestTimer = (hour: number, minute: number) => {
    setTestHour(hour);
    setTestMinute(minute);
    localStorage.setItem("hvylyna_test_hour", hour.toString());
    localStorage.setItem("hvylyna_test_minute", minute.toString());
  };

  const toggleTestTimer = (enabled: boolean) => {
    setIsTestTimerEnabled(enabled);
    localStorage.setItem("hvylyna_test_enabled", enabled.toString());
    if (enabled) {
      // Clear last trigger to allow immediate testing if time matches
      lastTriggerDate.current = "";
    }
  };

  return { 
    timeLeft, 
    isPlaying, 
    isTestTimerEnabled, 
    testHour,
    testMinute,
    setTestTimer,
    toggleTestTimer,
    toggleTestMode, 
    unlockAudio,
    stopPlayback, 
    audioMode, 
    changeAudioMode,
    introVariant,
    changeIntroVariant
  };
};
