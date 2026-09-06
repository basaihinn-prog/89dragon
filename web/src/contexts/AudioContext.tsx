import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { BACKGROUND_MUSIC_URL } from '../services/config';

interface AudioContextType {
  isMusicEnabled: boolean;
  volume: number;
  toggleMusic: () => void;
  setVolume: (v: number) => void;
  playDashboardMusic: () => void;
  stopMusic: () => void;
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isMusicEnabled, setIsMusicEnabled] = useState(() => {
    return localStorage.getItem('jr_music') !== 'false';
  });
  const [volume, setVolumeState] = useState(() => {
    return parseFloat(localStorage.getItem('jr_volume') || '0.3');
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(BACKGROUND_MUSIC_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
    }
    return audioRef.current;
  };

  const playDashboardMusic = useCallback(() => {
    if (!isMusicEnabled) return;
    const audio = getAudio();
    audio.play().catch(() => {});
  }, [isMusicEnabled, volume]);

  const stopMusic = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggleMusic = useCallback(() => {
    const next = !isMusicEnabled;
    setIsMusicEnabled(next);
    localStorage.setItem('jr_music', next ? 'true' : 'false');
    if (next) {
      getAudio().play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }
  }, [isMusicEnabled]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    localStorage.setItem('jr_volume', String(v));
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  return (
    <AudioCtx.Provider value={{ isMusicEnabled, volume, toggleMusic, setVolume, playDashboardMusic, stopMusic }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
