"use client";

import { useEffect, useRef, useState } from "react";

export type AudioMode = "speech_metronome" | "metronome_only" | "speech_music";
export type IntroVariant = "standard" | "alternative";

// Helper to get path for audio assets
const getAudioPath = (filename: string) => {
  if (typeof window === "undefined") return "";
  return `audio/${filename}`;
};

const logToStorage = (message: string) => {
  if (typeof window === "undefined") return;
  const logs = JSON.parse(localStorage.getItem("hvylyna_logs") || "[]");
  const entry = `${new Date().toLocaleTimeString('uk-UA')}: ${message}`;
  logs.unshift(entry);
  localStorage.setItem("hvylyna_logs", JSON.stringify(logs.slice(0, 50)));
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
  const [logs, setLogs] = useState<string[]>([]);

  const introAudio = useRef<HTMLAudioElement | null>(null);
  const metronomeAudio = useRef<HTMLAudioElement | null>(null);
  const musicAudio = useRef<HTMLAudioElement | null>(null);
  const lastTriggerDate = useRef<string>("");
  const isUnlocked = useRef(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const worker = useRef<Worker | null>(null);
  const silentPlayer = useRef<HTMLAudioElement | null>(null);
  const lastWorkerLogRef = useRef<number>(0);
  
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

      // Initialize silent player with real file (more reliable than Data URI on iOS)
      silentPlayer.current = new Audio(getAudioPath("silence.mp3"));
      silentPlayer.current.loop = true;
      silentPlayer.current.onpause = () => logToStorage("Heartbeat PAUSED");
      silentPlayer.current.onplay = () => logToStorage("Heartbeat PLAYING");

      [introAudio, metronomeAudio, musicAudio].forEach(ref => {
        if (ref.current) {
          ref.current.load();
          ref.current.preload = "auto";
        }
      });

      // Load initial logs
      const savedLogs = JSON.parse(localStorage.getItem("hvylyna_logs") || "[]");
      setLogs(savedLogs);
      logToStorage("App initialized");
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
    const getKyivSeconds = () => {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Kyiv",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      });
      const parts = formatter.formatToParts(new Date());
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || "0");
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value || "0");
      const second = parseInt(parts.find(p => p.type === 'second')?.value || "0");
      return { 
        total: hour * 3600 + minute * 60 + second,
        h: hour, m: minute, s: second,
        dateStr: new Date().toLocaleDateString("en-US", { timeZone: "Europe/Kyiv" })
      };
    };

    const checkTime = () => {
      const kyiv = getKyivSeconds();
      const kyivTodayStr = kyiv.dateStr;

      // Reset trigger if day changed
      if (lastTriggerDate.current !== kyivTodayStr && !lastTriggerDate.current.includes("_test")) {
        setHasTriggeredToday(false);
      }

      // Target seconds from midnight
      const targetSec = targetHour * 3600 + targetMinute * 60;
      let testTargetSec: number | null = null;
      if (isTestTimerEnabled) {
        testTargetSec = testHour * 3600 + testMinute * 60;
      }

      // Determine active countdown target
      let activeTargetSec = targetSec;
      if (testTargetSec !== null) {
        // If test is in the future OR within the last minute, count down to it
        if (testTargetSec > kyiv.total || (testTargetSec <= kyiv.total && testTargetSec + 60 > kyiv.total)) {
          activeTargetSec = testTargetSec;
        }
      }

      let diff = activeTargetSec - kyiv.total;
      if (diff < 0) diff += 86400; // Next day

      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;

      setTimeLeft(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );

      // TRIGGER LOGIC
      const isExactlyMainTime = kyiv.total >= targetSec && kyiv.total < targetSec + 5;
      const isExactlyTestTime = testTargetSec !== null && kyiv.total >= testTargetSec && kyiv.total < testTargetSec + 5;

      const shouldTriggerMain = isExactlyMainTime && lastTriggerDate.current !== kyivTodayStr;
      const shouldTriggerTest = isExactlyTestTime && lastTriggerDate.current !== kyivTodayStr + "_test";

      if ((shouldTriggerMain || shouldTriggerTest) && !isPlaying) {
        console.log("TRIGGERED! Main:", shouldTriggerMain, "Test:", shouldTriggerTest);
        logToStorage(`Triggered: ${shouldTriggerMain ? "Main 09:00" : "Test Timer"}`);
        lastTriggerDate.current = shouldTriggerTest ? kyivTodayStr + "_test" : kyivTodayStr;
        setHasTriggeredToday(true);
        startPlayback();
      }
    };
    const checkTimeWrapper = () => {
      // Periodic log to confirm worker is alive under lock
      const now = Date.now();
      if (now - lastWorkerLogRef.current > 30000) {
        logToStorage("Timer active (worker)");
        lastWorkerLogRef.current = now;
        setLogs(JSON.parse(localStorage.getItem("hvylyna_logs") || "[]"));
      }
      checkTime();
    };

    // Initialize Web Worker Timer
    try {
      if (typeof window !== "undefined" && !worker.current) {
        // More robust URL construction for GitHub Pages base path
        const basePath = window.location.pathname.startsWith('/hvylyna-movchannya') ? '/hvylyna-movchannya' : '';
        worker.current = new Worker(`${basePath}/timer-worker.js`);
        worker.current.onmessage = (e) => {
          if (e.data === 'tick') checkTimeWrapper();
        };
        worker.current.postMessage('start');
        logToStorage("Web Worker timer started");
      }
    } catch (e) {
      console.error("Worker failed, falling back to setInterval", e);
      logToStorage("Worker failed, fallback active");
      const timer = setInterval(checkTimeWrapper, 1000);
      return () => clearInterval(timer);
    }

    checkTime();

    // Re-check immediately when app returns to foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("App visible, performing immediate time check...");
        logToStorage("App visible, resyncing");
        checkTime();
        setLogs(JSON.parse(localStorage.getItem("hvylyna_logs") || "[]"));
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (worker.current) worker.current.postMessage('stop');
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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

    // Start Silent Heartbeat to keep process alive on mobile
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const silence = audioCtx.current.createBufferSource();
        silence.buffer = audioCtx.current.createBuffer(1, 1, 22050);
        silence.loop = true;
        silence.connect(audioCtx.current.destination);
        silence.start();
        console.log("Silent heartbeat started via AudioContext");
        logToStorage("AudioContext Heartbeat started");
      }
      
      if (silentPlayer.current) {
        await silentPlayer.current.play();
        console.log("Silent MP3 loop started");
        logToStorage("Silent MP3 Heartbeat started");
      }
    } catch (e) {
      console.error("Failed to start silent heartbeat:", e);
      logToStorage("Heartbeat failure: " + e);
    }
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
    changeIntroVariant,
    logs,
    clearLogs: () => {
      localStorage.removeItem("hvylyna_logs");
      setLogs([]);
    }
  };
};
