"use client";

import { useEffect, useRef, useState } from "react";

export type AudioMode = "speech_metronome" | "metronome_only" | "speech_music" | "speech_metronome_anthem";
export type IntroVariant = "standard" | "alternative";
export type AnthemVariant = "instrumental" | "choral" | "rock";

// Helper to get path for audio assets
const getAudioPath = (filename: string) => {
  if (typeof window === "undefined") return "";
  // Check if we are on GitHub Pages or local
  const isGitHubPages = window.location.pathname.startsWith('/hvylyna-movchannya');
  const base = isGitHubPages ? '/hvylyna-movchannya/' : '/';
  return `${base}audio/${filename}`;
};

const logToStorage = (message: string) => {
  if (typeof window === "undefined") return;
  const now = new Date();
  const time = now.toLocaleTimeString("uk-UA", { 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit",
    timeZone: "Europe/Kyiv" 
  });
  const entry = `${time}: ${message}`;
  const logsArr = JSON.parse(localStorage.getItem("hvylyna_logs") || "[]");
  logsArr.unshift(entry);
  localStorage.setItem("hvylyna_logs", JSON.stringify(logsArr.slice(0, 50)));
};

export const useAudioEngine = (targetHour: number = 9, targetMinute: number = 0) => {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>("speech_metronome");
  const [introVariant, setIntroVariant] = useState<IntroVariant>("standard");
  const [anthemVariant, setAnthemVariant] = useState<AnthemVariant>("instrumental");
  
  // Test Mode state
  const [isTestTimerEnabled, setIsTestTimerEnabled] = useState(false);
  const [testHour, setTestHour] = useState(9);
  const [testMinute, setTestMinute] = useState(1);
  const [hasTriggeredToday, setHasTriggeredToday] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const introAudio = useRef<HTMLAudioElement | null>(null);
  const metronomeAudio = useRef<HTMLAudioElement | null>(null);
  const musicAudio = useRef<HTMLAudioElement | null>(null);
  const anthemAudio = useRef<HTMLAudioElement | null>(null);
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

      const savedAnthem = localStorage.getItem("hvylyna_anthem_variant") as AnthemVariant;
      if (savedAnthem) setAnthemVariant(savedAnthem);

      const savedTestHour = localStorage.getItem("hvylyna_test_hour");
      if (savedTestHour) {
        const h = parseInt(savedTestHour);
        if (!isNaN(h)) setTestHour(Math.max(0, Math.min(23, h)));
      }

      const savedTestMin = localStorage.getItem("hvylyna_test_minute");
      if (savedTestMin) {
        const m = parseInt(savedTestMin);
        if (!isNaN(m)) setTestMinute(Math.max(0, Math.min(59, m)));
      }

      const savedTestEnabled = localStorage.getItem("hvylyna_test_enabled");
      if (savedTestEnabled === "true") setIsTestTimerEnabled(true);

      const introPath = getAudioPath("intro.mp3");
      const metronomePath = getAudioPath("metronome.mp3");
      const musicPath = getAudioPath("metronome_only.mp3"); // Using this as solemn music if solemn_music.mp3 is placeholder
      const anthemPath = getAudioPath("anthem_instrumental.mp3");

      console.log("Audio Paths:", { introPath, metronomePath, musicPath, anthemPath });

      introAudio.current = new Audio(introPath);
      metronomeAudio.current = new Audio(metronomePath);
      musicAudio.current = new Audio(musicPath);
      anthemAudio.current = new Audio(anthemPath);

      // Setup transition handlers once
      introAudio.current.onended = () => {
        const mode = audioModeRef.current;
        console.log("Intro ended, starting background mode:", mode);
        const bgAudio = mode === "speech_music" ? musicAudio.current : metronomeAudio.current;
        if (bgAudio) {
          bgAudio.loop = true;
          bgAudio.play().catch(e => console.warn("Background audio blocked", e));
        }
        
        // Duration logic
        if (mode === "speech_metronome_anthem") {
          // Play metronome for 60s, then switch to anthem
          setTimeout(() => {
            if (metronomeAudio.current) {
              metronomeAudio.current.pause();
              metronomeAudio.current.currentTime = 0;
            }
            if (anthemAudio.current) {
              // Ensure onended is correctly set for normal playback (not preview)
              anthemAudio.current.onended = () => {
                console.log("Anthem finished");
                stopPlayback();
              };
              anthemAudio.current.play().catch(e => console.error("Anthem blocked", e));
            }
          }, 60000);
        } else {
          // Background runs for 60 seconds (standard)
          setTimeout(() => stopPlayback(), 60000);
        }
      };

      // Initial onended for anthem
      anthemAudio.current.onended = () => {
        console.log("Anthem finished");
        stopPlayback();
      };

      // Initialize silent player with real file (more reliable than Data URI on iOS)
      silentPlayer.current = new Audio(getAudioPath("silence.mp3"));
      silentPlayer.current.loop = true;
      silentPlayer.current.onpause = () => logToStorage("Heartbeat PAUSED");
      silentPlayer.current.onplay = () => logToStorage("Heartbeat PLAYING");

      [introAudio, metronomeAudio, musicAudio, anthemAudio].forEach(ref => {
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

  // Sync anthem variant to audio object
  useEffect(() => {
    if (typeof window !== "undefined" && anthemAudio.current) {
      const filename = `anthem_${anthemVariant}.mp3`;
      anthemAudio.current.src = getAudioPath(filename);
      anthemAudio.current.load();
    }
  }, [anthemVariant]);

  // Function to calculate and update UI time state
  // We keep this inside a ref to avoid stale closures in the worker/interval callbacks
  const checkTimeRef = useRef<() => void | undefined>(undefined);

  const checkTime = () => {
    const getKyivSeconds = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        timeZone: "Europe/Kyiv", 
        hour: "numeric", 
        minute: "numeric", 
        second: "numeric", 
        hour12: false 
      };
      
      try {
        const formatter = new Intl.DateTimeFormat("en-GB", options);
        const parts = formatter.formatToParts(now);
        
        const finder = (type: string) => {
          const val = parts.find(p => p.type === type)?.value;
          return parseInt(val || "0", 10);
        };

        let hour = finder('hour');
        let minute = finder('minute');
        let second = finder('second');

        if (hour >= 24) hour = 0;
        
        hour = Math.max(0, Math.min(23, hour));
        minute = Math.max(0, Math.min(59, minute));
        second = Math.max(0, Math.min(59, second));

        return { 
          total: hour * 3600 + minute * 60 + second,
          h: hour, m: minute, s: second,
          dateStr: now.toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" })
        };
      } catch (e) {
        const d = new Date(now.getTime() + (3 * 3600000) + (now.getTimezoneOffset() * 60000));
        return {
          total: d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(),
          h: d.getHours(), m: d.getMinutes(), s: d.getSeconds(),
          dateStr: "fallback"
        };
      }
    };

    const kyiv = getKyivSeconds();
    const kyivTodayStr = kyiv.dateStr;

    // Reset trigger if day changed
    if (lastTriggerDate.current !== kyivTodayStr && !lastTriggerDate.current.includes("_test")) {
      setHasTriggeredToday(false);
    }

    // Target calculation
    const targetSec = targetHour * 3600 + targetMinute * 60;
    let activeTargetSec = targetSec;
    
    if (isTestTimerEnabled) {
      const testTargetSec = testHour * 3600 + testMinute * 60;
      // If test is in the future OR within the last minute, count down to it
      if (testTargetSec > kyiv.total || (testTargetSec <= kyiv.total && testTargetSec + 60 > kyiv.total)) {
        activeTargetSec = testTargetSec;
      }
    }

    let diff = activeTargetSec - kyiv.total;
    if (diff < 0) diff += 86400;

    const h_disp = Math.floor(diff / 3600);
    const m_disp = Math.floor((diff % 3600) / 60);
    const s_disp = diff % 60;

    const timeStr = `${h_disp.toString().padStart(2, "0")}:${m_disp.toString().padStart(2, "0")}:${s_disp.toString().padStart(2, "0")}`;
    setTimeLeft(timeStr);

    // TRIGGER LOGIC
    const isExactlyMainTime = kyiv.total >= targetSec && kyiv.total < targetSec + 5;
    
    let isExactlyTestTime = false;
    if (isTestTimerEnabled) {
      const testTargetSec = testHour * 3600 + testMinute * 60;
      isExactlyTestTime = kyiv.total >= testTargetSec && kyiv.total < testTargetSec + 5;
    }

    const shouldTriggerMain = isExactlyMainTime && lastTriggerDate.current !== kyivTodayStr;
    const shouldTriggerTest = isExactlyTestTime && lastTriggerDate.current !== kyivTodayStr + "_test";

    if ((shouldTriggerMain || shouldTriggerTest) && !isPlaying) {
      console.log("TRIGGERED! Main:", shouldTriggerMain, "Test:", shouldTriggerTest);
      logToStorage(`Triggered: ${shouldTriggerMain ? "Main 09:00" : "Test Timer"}`);
      lastTriggerDate.current = shouldTriggerTest ? kyivTodayStr + "_test" : kyivTodayStr;
      setHasTriggeredToday(true);
      startPlayback();
    }

    // Sync logs to state for UI updates
    try {
      const stored = localStorage.getItem('hvylyna_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length !== logs.length) {
          setLogs(parsed);
        }
      }
    } catch (e) {}

    // Periodic "heartbeat" check inside browser context
    const now = Date.now();
    if (now - lastWorkerLogRef.current > 30000) {
      logToStorage("Timer active (pulse)");
      lastWorkerLogRef.current = now;
    }
  };

  // Update logic reference every render to avoid stale closures
  useEffect(() => {
    checkTimeRef.current = checkTime;
  });

  // Main Timer Lifecycle Effect
  useEffect(() => {
    const handleTick = () => {
      checkTimeRef.current?.();
    };

    // Initialize Web Worker Timer once
    try {
      if (typeof window !== "undefined" && !worker.current) {
        const basePath = window.location.pathname.startsWith('/hvylyna-movchannya') ? '/hvylyna-movchannya' : '';
        worker.current = new Worker(`${basePath}/timer-worker.js`);
        worker.current.onmessage = (e) => {
          if (e.data === 'tick') handleTick();
        };
        worker.current.postMessage('start');
        logToStorage("Web Worker heartbeat initialized");
      }
    } catch (e) {
      console.error("Worker failed, falling back to setInterval", e);
      logToStorage("Worker failed, fallback active");
      const timer = setInterval(handleTick, 1000);
      return () => clearInterval(timer);
    }

    // Still perform an initial tick
    handleTick();

    // Re-check immediately when app returns to foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        logToStorage("Foreground resync");
        handleTick();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // NOTE: We DO NOT stop the worker here because it's persistent in worker.current
      // This ensures background execution survives React component re-renders/hot-reloads.
    };
  }, []); // Only run once on mount!


  const changeAudioMode = (mode: AudioMode) => {
    setAudioMode(mode);
    localStorage.setItem("hvylyna_audio_mode", mode);
  };

  const changeIntroVariant = (variant: IntroVariant) => {
    setIntroVariant(variant);
    localStorage.setItem("hvylyna_intro_variant", variant);
  };

  const changeAnthemVariant = (variant: AnthemVariant) => {
    setAnthemVariant(variant);
    localStorage.setItem("hvylyna_anthem_variant", variant);
  };

  const startPlayback = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setIsPreviewing(false); // Stop preview when actual playback starts
    
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
    [introAudio, metronomeAudio, musicAudio, anthemAudio].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    setIsPlaying(false);
    setIsPreviewing(false);
  };

  const previewAnthem = async (variant: AnthemVariant) => {
    if (isPlaying) return;
    
    // Stop any active audio first
    if (anthemAudio.current) {
      anthemAudio.current.pause();
      anthemAudio.current.currentTime = 0;
    }

    if (isPreviewing) {
      setIsPreviewing(false);
      return;
    }

    setIsPreviewing(true);
    if (anthemAudio.current) {
      const filename = `anthem_${variant}.mp3`;
      anthemAudio.current.src = getAudioPath(filename);
      anthemAudio.current.load();
      try {
        await anthemAudio.current.play();
        // Reset preview state when audio ends naturally
        anthemAudio.current.onended = () => {
          setIsPreviewing(false);
          // Restore the anthem ended handler for normal operation
          if (anthemAudio.current) {
            anthemAudio.current.onended = () => {
              console.log("Anthem finished");
              stopPlayback();
            };
          }
        };
      } catch (e) {
        console.error("Preview blocked", e);
        setIsPreviewing(false);
      }
    }
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
      prime(musicAudio.current),
      prime(anthemAudio.current)
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
    isPreviewing,
    isTestTimerEnabled, 
    testHour,
    testMinute,
    setTestTimer,
    toggleTestTimer,
    toggleTestMode, 
    unlockAudio,
    stopPlayback,
    previewAnthem,
    audioMode, 
    changeAudioMode,
    introVariant,
    changeIntroVariant,
    anthemVariant,
    changeAnthemVariant,
    logs,
    clearLogs: () => {
      localStorage.removeItem("hvylyna_logs");
      setLogs([]);
    }
  };
};
