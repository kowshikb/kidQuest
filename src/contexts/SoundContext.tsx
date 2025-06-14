import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSound as useSoundLib } from 'use-sound';

interface SoundContextType {
  isSoundEnabled: boolean;
  toggleSound: () => void;
  playSound: (sound: SoundType) => void;
}

type SoundType = 'click' | 'success' | 'error' | 'coin' | 'complete' | 'challenge';

const SOUND_URLS = {
  click: 'https://assets.mixkit.co/sfx/preview/mixkit-light-button-2580.mp3',
  success: 'https://assets.mixkit.co/sfx/preview/mixkit-game-level-completed-2059.mp3',
  error: 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3',
  coin: 'https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-1992.mp3',
  complete: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
  challenge: 'https://assets.mixkit.co/sfx/preview/mixkit-magical-discover-notification-2293.mp3'
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}

interface SoundProviderProps {
  children: ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('kidquest-sound-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('kidquest-sound-enabled', JSON.stringify(isSoundEnabled));
  }, [isSoundEnabled]);

  const [playClickSound] = useSoundLib(SOUND_URLS.click, { volume: 0.5, soundEnabled: isSoundEnabled });
  const [playSuccessSound] = useSoundLib(SOUND_URLS.success, { volume: 0.5, soundEnabled: isSoundEnabled });
  const [playErrorSound] = useSoundLib(SOUND_URLS.error, { volume: 0.5, soundEnabled: isSoundEnabled });
  const [playCoinSound] = useSoundLib(SOUND_URLS.coin, { volume: 0.5, soundEnabled: isSoundEnabled });
  const [playCompleteSound] = useSoundLib(SOUND_URLS.complete, { volume: 0.5, soundEnabled: isSoundEnabled });
  const [playChallengeSound] = useSoundLib(SOUND_URLS.challenge, { volume: 0.5, soundEnabled: isSoundEnabled });

  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  };

  const playSound = (sound: SoundType) => {
    if (!isSoundEnabled) return;

    switch (sound) {
      case 'click':
        playClickSound();
        break;
      case 'success':
        playSuccessSound();
        break;
      case 'error':
        playErrorSound();
        break;
      case 'coin':
        playCoinSound();
        break;
      case 'complete':
        playCompleteSound();
        break;
      case 'challenge':
        playChallengeSound();
        break;
    }
  };

  const value = {
    isSoundEnabled,
    toggleSound,
    playSound
  };

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};