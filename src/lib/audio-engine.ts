"use client";

import { useEffect, useRef, useState } from "react";
import { LocalNotifications } from '@capacitor/local-notifications';

export type AudioMode = "speech_metronome" | "metronome_only" | "speech_music" | "speech_metronome_anthem";
export type IntroVariant = "standard" | "alternative";
export type AnthemVariant = "instrumental" | "choral" | "rock" | "verovka";

// Helper to get path for audio assets
const getAudioPath = (filename: string) => {
  if (typeof window === "undefined") return "";
  
  // Capacitor detection
  const isCapacitor = (window as any).Capacitor !== undefined;
  
  if (isCapacitor) {
    // In Capacitor, assets are served from the root of the app
    return `audio/${filename}`;
  }

  // Check if we are on GitHub Pages or local web server
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
  const anthemTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeTimeoutRef = useRef<NodeJS.Timeout | null>(null); // New central timeout ref
  const lastTriggerDate = useRef<string>("");
  const isPlayingRef = useRef(false); // New ref for immediate state tracking
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
        // Read current mode directly from localStorage to ensure it's ALWAYS fresh
        // regardless of React closures, since onended is a global DOM event
        const savedMode = localStorage.getItem("hvylyna_audio_mode") as AudioMode;
        const mode = savedMode || audioModeRef.current;
        
        console.log("Intro ended, starting background mode:", mode);
        
        const bgAudio = mode === "speech_music" ? musicAudio.current : metronomeAudio.current;
        if (bgAudio) {
          bgAudio.loop = false; // We use timeout for exact duration
          bgAudio.currentTime = 0;
          bgAudio.play().catch(e => console.warn("Background audio blocked", e));
        }
        
        // Duration logic
        if (mode === "speech_metronome_anthem") {
          // Play metronome for 60s, then switch to anthem
          if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
          activeTimeoutRef.current = setTimeout(() => {
            if (metronomeAudio.current) {
              metronomeAudio.current.pause();
              metronomeAudio.current.currentTime = 0;
            }
            if (anthemAudio.current) {
              console.log("Starting anthem...");
              // Ensure onended is correctly set for normal playback (not preview)
              anthemAudio.current.onended = () => {
                console.log("Anthem finished");
                stopPlayback();
              };
              anthemAudio.current.currentTime = 0;
              anthemAudio.current.play().catch(e => console.error("Anthem blocked", e));
            }
          }, 60000);
        } else {
          // Background runs for 60 seconds (standard) then stop
          if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
          activeTimeoutRef.current = setTimeout(() => {
            console.log("Standard duration reached, stopping...");
            stopPlayback();
          }, 60000);
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

      // Initial schedule
      scheduleMorningNotification();

      // Setup WakeLock if supported
      if ('wakeLock' in navigator) {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
          try {
            wakeLock = await (navigator as any).wakeLock.request('screen');
            logToStorage("WakeLock active");
          } catch (err) {}
        };
        requestWakeLock();
        document.addEventListener('visibilitychange', () => {
          if (wakeLock !== null && document.visibilityState === 'visible') {
            requestWakeLock();
          }
        });
      }
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

    if ((shouldTriggerMain || shouldTriggerTest) && !isPlayingRef.current) {
      console.log("TRIGGERED! Main:", shouldTriggerMain, "Test:", shouldTriggerTest);
      logToStorage(`Triggered: ${shouldTriggerMain ? "Main 09:00" : "Test Timer"}`);
      lastTriggerDate.current = shouldTriggerTest ? kyivTodayStr + "_test" : kyivTodayStr;
      setHasTriggeredToday(true);
      startPlayback();
    } else if ((shouldTriggerMain || shouldTriggerTest) && isPlayingRef.current) {
      // Prevent log spam, but helpful for debugging
      if (Date.now() % 5000 < 1000) console.log("Trigger condition met but already playing...");
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
      
      // Auto-schedule notification for tomorrow if needed
      scheduleMorningNotification();
    }
  };

  const scheduleMorningNotification = async () => {
    if (typeof window === "undefined" || (window as any).Capacitor === undefined) return;
    
    try {
      const perms = await LocalNotifications.checkPermissions();
      if (perms.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      // Schedule for 9:00 AM
      const now = new Date();
      const scheduleDate = new Date();
      scheduleDate.setHours(9, 0, 0, 0);
      
      if (scheduleDate <= now) {
        scheduleDate.setDate(scheduleDate.getDate() + 1);
      }

      await LocalNotifications.cancel({ notifications: [{ id: 900 }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Хвилина Мовчання",
            body: "Починається загальнонаціональна хвилина мовчання. Будь ласка, відкрийте додаток.",
            id: 900,
            schedule: { at: scheduleDate, allowWhileIdle: true },
            sound: 'res://raw/bell', // fallback if possible
            attachments: [],
            actionTypeId: "",
            extra: null
          }
        ]
      });
      // console.log("Morning notification scheduled for:", scheduleDate);
    } catch (e) {
      console.warn("Notification schedule failed:", e);
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
    if (isPlayingRef.current) {
      console.warn("startPlayback called while already playing. Ignoring.");
      return;
    }
    
    console.log("Starting playback...");
    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsPreviewing(false); 
    
    try {
      const savedMode = localStorage.getItem("hvylyna_audio_mode") as AudioMode;
      const currentMode = savedMode || audioMode;

      if (currentMode === "metronome_only") {
        if (metronomeAudio.current) {
          console.log("Starting metronome only...");
          metronomeAudio.current.loop = true;
          metronomeAudio.current.currentTime = 0;
          await metronomeAudio.current.play();
        }
        
        if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
        activeTimeoutRef.current = setTimeout(() => {
          console.log("Metronome only duration reached");
          stopPlayback();
        }, 60000);
      } else {
        // Speech modes - always start with intro
        if (introAudio.current) {
          console.log("Starting intro speech...");
          // Intro ends event handles the transition to bgAudio automatically
          introAudio.current.currentTime = 0;
          await introAudio.current.play();
        }
      }
    } catch (error) {
      console.error("Playback failed:", error);
      logToStorage("Playback error: " + error);
      stopPlayback();
    }
  };

  const stopPlayback = () => {
    console.log("Stopping all playback...");
    isPlayingRef.current = false;
    
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
      activeTimeoutRef.current = null;
    }
    
    if (anthemTimeoutRef.current) {
      clearTimeout(anthemTimeoutRef.current);
      anthemTimeoutRef.current = null;
    }
    
    [introAudio, metronomeAudio, musicAudio, anthemAudio].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
        // Don't nullify onended here yet, as it's set in useEffect
        // but it's safe because isPlayingRef is false
      }
    });
    
    setIsPlaying(false);
    setIsPreviewing(false);
    logToStorage("Playback stopped");
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
    console.log("Attempting to unlock audio for mobile...");
    logToStorage("Unlocking audio system...");
    
    const prime = async (audio: HTMLAudioElement | null, name: string) => {
      if (!audio) return;
      try {
        const originalVolume = audio.volume;
        audio.volume = 0;
        // Some mobile browsers need play() to be called in a user gesture handler
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          audio.pause();
          audio.currentTime = 0;
        }
        audio.volume = originalVolume;
        console.log(`Unlocked: ${name}`);
        logToStorage(`Audio unlocked: ${name}`);
      } catch (e) {
        console.warn(`Unlock failed for ${name}:`, e);
        logToStorage(`Unlock failed: ${name}`);
      }
    };

    // Pre-unlock all main elements
    await Promise.all([
      prime(introAudio.current, "Intro"),
      prime(metronomeAudio.current, "Metronome"),
      prime(musicAudio.current, "Music"),
      prime(anthemAudio.current, "Anthem")
    ]);
    
    isUnlocked.current = true;
    console.log("Audio system unlocked for this session.");
    logToStorage("Audio system FULLY UNLOCKED");

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
