import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface SoundContextType {
  isSoundEnabled: boolean;
  toggleSound: () => void;
  playSound: (sound: SoundType) => void;
}

type SoundType =
  | "click"
  | "success"
  | "error"
  | "coin"
  | "complete"
  | "challenge"
  | "mascot";

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}

interface SoundProviderProps {
  children: ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("kidquest-sound-enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem(
      "kidquest-sound-enabled",
      JSON.stringify(isSoundEnabled)
    );
  }, [isSoundEnabled]);

  // ✅ MODERN SOLUTION: Web Audio API for clean, reliable sounds
  const createBeep = (
    frequency: number,
    duration: number,
    volume: number = 0.3
  ) => {
    if (!isSoundEnabled) return;

    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        volume,
        audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      // Clean up
      setTimeout(() => {
        audioContext.close();
      }, duration * 1000 + 100);
    } catch (error) {
      console.warn("Audio context not supported:", error);
    }
  };

  const createChord = (
    frequencies: number[],
    duration: number,
    volume: number = 0.2
  ) => {
    if (!isSoundEnabled) return;

    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = "sine";

        const startTime = audioContext.currentTime + index * 0.1;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });

      // Clean up
      setTimeout(() => {
        audioContext.close();
      }, (duration + frequencies.length * 0.1) * 1000 + 100);
    } catch (error) {
      console.warn("Audio context not supported:", error);
    }
  };

  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);

    // Play a test sound when enabling
    if (newState) {
      setTimeout(() => {
        createBeep(800, 0.1, 0.2);
      }, 100);
    }
  };

  const playSound = (sound: SoundType) => {
    if (!isSoundEnabled) return;

    try {
      switch (sound) {
        case "click":
          createBeep(800, 0.1, 0.2);
          break;
        case "success":
          // Happy ascending notes
          createChord([523, 659, 784], 0.3, 0.25);
          break;
        case "error":
          // Descending error sound
          createBeep(300, 0.2, 0.3);
          setTimeout(() => createBeep(200, 0.2, 0.3), 100);
          break;
        case "coin":
          // Classic coin pickup sound
          createBeep(800, 0.1, 0.2);
          setTimeout(() => createBeep(1000, 0.1, 0.2), 50);
          break;
        case "complete":
          // Victory fanfare
          createChord([523, 659, 784, 1047], 0.5, 0.3);
          break;
        case "challenge":
          // Magical discovery
          createBeep(400, 0.1, 0.2);
          setTimeout(() => createBeep(600, 0.1, 0.2), 80);
          setTimeout(() => createBeep(800, 0.15, 0.2), 160);
          break;
        case "mascot":
          // Playful bounce sound
          createBeep(600, 0.08, 0.2);
          setTimeout(() => createBeep(400, 0.08, 0.2), 60);
          setTimeout(() => createBeep(800, 0.1, 0.2), 120);
          break;
        default:
          console.warn(`Unknown sound type: ${sound}`);
      }
    } catch (error) {
      console.warn(`Failed to play sound ${sound}:`, error);
    }
  };

  const value = {
    isSoundEnabled,
    toggleSound,
    playSound,
  };

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
};
