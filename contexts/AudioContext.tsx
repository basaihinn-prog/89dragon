import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { AppState, AppStateStatus, Platform } from "react-native";
import { BACKGROUND_MUSIC_URL } from "@/services/config";

interface AudioContextType {
  isMusicEnabled: boolean;
  isMusicPlaying: boolean;
  volume: number;
  toggleMusic: () => void;
  setMusicEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  playDashboardMusic: () => void;
  stopDashboardMusic: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const MUSIC_ENABLED_KEY = "music_enabled";
const VOLUME_KEY = "music_volume";

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [isReady, setIsReady] = useState(false);
  const [shouldPlayWhenReady, setShouldPlayWhenReady] = useState(false);
  const appState = useRef(AppState.currentState);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadSettings();
    setupAudioMode();

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
      unloadSound();
    };
  }, []);

  useEffect(() => {
    if (isReady && shouldPlayWhenReady && isMusicEnabled && soundRef.current) {
      soundRef.current.setVolumeAsync(volume).catch(console.error);
      soundRef.current.playAsync().catch(console.error);
      setIsMusicPlaying(true);
    }
  }, [isReady, shouldPlayWhenReady, isMusicEnabled]);

  useEffect(() => {
    if (soundRef.current && isReady) {
      soundRef.current.setVolumeAsync(volume).catch(console.error);
    }
  }, [volume, isReady]);

  async function setupAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error("Error setting audio mode:", error);
    }
  }

  function handleAppStateChange(nextAppState: AppStateStatus) {
    if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      if (soundRef.current && isMusicPlaying) {
        soundRef.current.pauseAsync().catch(console.error);
      }
    } else if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      if (soundRef.current && isMusicEnabled && isMusicPlaying) {
        soundRef.current.playAsync().catch(console.error);
      }
    }
    appState.current = nextAppState;
  }

  async function loadSettings() {
    try {
      const [musicEnabled, savedVolume] = await Promise.all([
        AsyncStorage.getItem(MUSIC_ENABLED_KEY),
        AsyncStorage.getItem(VOLUME_KEY),
      ]);

      if (musicEnabled !== null) {
        setIsMusicEnabled(musicEnabled === "true");
      }
      if (savedVolume !== null) {
        setVolumeState(parseFloat(savedVolume));
      }
    } catch (error) {
      console.error("Error loading audio settings:", error);
    }
  }

  async function loadSound() {
    if (soundRef.current) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: BACKGROUND_MUSIC_URL },
        { 
          isLooping: true, 
          volume: volume,
          shouldPlay: false,
        }
      );
      soundRef.current = sound;
      setIsReady(true);
    } catch (error) {
      console.error("Error loading sound:", error);
    }
  }

  async function unloadSound() {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsReady(false);
      } catch (error) {
        console.error("Error unloading sound:", error);
      }
    }
  }

  async function playDashboardMusic() {
    if (!isMusicEnabled) return;
    
    setShouldPlayWhenReady(true);
    
    if (!soundRef.current) {
      await loadSound();
    }
    
    if (soundRef.current && isReady) {
      try {
        await soundRef.current.setVolumeAsync(volume);
        await soundRef.current.playAsync();
        setIsMusicPlaying(true);
      } catch (error) {
        console.error("Error playing music:", error);
      }
    }
  }

  async function stopDashboardMusic() {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        await soundRef.current.setPositionAsync(0);
      }
      setShouldPlayWhenReady(false);
      setIsMusicPlaying(false);
    } catch (error) {
      console.error("Error stopping music:", error);
    }
  }

  function toggleMusic() {
    const newValue = !isMusicEnabled;
    setMusicEnabled(newValue);
  }

  async function setMusicEnabled(enabled: boolean) {
    setIsMusicEnabled(enabled);
    await AsyncStorage.setItem(MUSIC_ENABLED_KEY, enabled ? "true" : "false");

    if (enabled && soundRef.current && isReady) {
      await soundRef.current.setVolumeAsync(volume);
      await soundRef.current.playAsync();
      setIsMusicPlaying(true);
      setShouldPlayWhenReady(true);
    } else if (!enabled && soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsMusicPlaying(false);
    }
  }

  async function setVolume(newVolume: number) {
    setVolumeState(newVolume);
    await AsyncStorage.setItem(VOLUME_KEY, newVolume.toString());
    
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(newVolume);
    }
  }

  return (
    <AudioContext.Provider
      value={{
        isMusicEnabled,
        isMusicPlaying,
        volume,
        toggleMusic,
        setMusicEnabled,
        setVolume,
        playDashboardMusic,
        stopDashboardMusic,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
