import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../contexts/SoundContext';

// Mascot states
type MascotState = 'idle' | 'happy' | 'excited' | 'thinking' | 'speaking';

// Mascot messages for different states
const MASCOT_MESSAGES = {
  idle: [
    "Click me for a tip!",
    "Need help on your quest?",
    "I'm your magical guide!"
  ],
  happy: [
    "Great job, champion!",
    "You're doing amazing!",
    "That was fantastic!"
  ],
  excited: [
    "WOW! That was EPIC!",
    "You're a true CHAMPION!",
    "INCREDIBLE work!"
  ],
  thinking: [
    "Hmm, let me think...",
    "Searching my magical wisdom...",
    "Let me ponder that..."
  ],
  speaking: [
    "Did you know? Every challenge you complete makes you stronger!",
    "Try inviting a friend to learn together!",
    "Remember to celebrate small victories along your journey!",
    "The more quests you complete, the more magic you unlock!",
    "Woof! I'm your loyal companion on this adventure!",
    "Bark bark! Let's have some fun learning together!"
  ]
};

// Mascot component with animations and interactions
const Mascot: React.FC = () => {
  const [state, setState] = useState<MascotState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const { playSound } = useSound();

  // Change mascot state randomly for idle animations
  useEffect(() => {
    const interval = setInterval(() => {
      if (state === 'idle' && !isMessageVisible) {
        const shouldAnimate = Math.random() > 0.7;
        if (shouldAnimate) {
          const randomState: MascotState = Math.random() > 0.5 ? 'thinking' : 'happy';
          setState(randomState);
          setTimeout(() => setState('idle'), 2000);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [state, isMessageVisible]);

  // Handle click on mascot
  const handleMascotClick = () => {
    // ✅ NEW: Play funny dog sound that kids will love!
    playSound('mascot');
    
    if (isMessageVisible) {
      setIsMessageVisible(false);
      setTimeout(() => setState('idle'), 500);
    } else {
      setState('speaking');
      const randomMessage = MASCOT_MESSAGES.speaking[Math.floor(Math.random() * MASCOT_MESSAGES.speaking.length)];
      setMessage(randomMessage);
      setIsMessageVisible(true);
    }
  };

  // Get current message based on state
  const getCurrentMessage = () => {
    if (message) return message;
    
    const messages = MASCOT_MESSAGES[state];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="mascot-container">
      {/* Message bubble */}
      <AnimatePresence>
        {isMessageVisible && (
          <motion.div
            className="absolute bottom-full mb-2 p-3 bg-white rounded-xl shadow-lg max-w-xs right-0"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            style={{ 
              transformOrigin: 'bottom right',
              border: '2px solid #8B5CF6'
            }}
          >
            <div 
              className="absolute bottom-[-6px] right-3 w-2 h-2 bg-white rotate-45"
              style={{ border: '0 solid transparent', borderRight: '2px solid #8B5CF6', borderBottom: '2px solid #8B5CF6' }}
            ></div>
            <p className="text-purple-800 text-sm">{getCurrentMessage()}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ✅ COMPLETELY NEW: Transparent, Ultra-Cute Dog Mascot */}
      <motion.div
        className="cursor-pointer relative"
        onClick={handleMascotClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* ✅ FULLY TRANSPARENT BACKGROUND with magical glow effect */}
        <motion.div
          className="relative w-16 h-16 flex items-center justify-center"
          animate={
            state === 'idle' ? { y: [0, -3, 0] } :
            state === 'happy' ? { rotate: [-3, 3, -3, 3, 0] } :
            state === 'excited' ? { scale: [1, 1.2, 1] } :
            state === 'thinking' ? { x: [0, 2, -2, 0] } :
            state === 'speaking' ? { y: [0, -2, 0, -2, 0] } :
            {}
          }
          transition={{ 
            duration: state === 'idle' ? 3 : 0.5, 
            repeat: state === 'idle' ? Infinity : 0,
            repeatType: "reverse",
            ease: "easeInOut" 
          }}
          style={{
            // ✅ COMPLETELY TRANSPARENT with magical purple glow
            background: 'transparent',
            filter: 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.4))',
          }}
        >
          {/* ✅ ADORABLE DOG DESIGN - Completely redesigned for maximum cuteness */}
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 80 80" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* ✅ MAGICAL AURA BACKGROUND */}
            <circle 
              cx="40" 
              cy="40" 
              r="35" 
              fill="url(#magicalAura)"
              opacity="0.3"
            />
            
            {/* ✅ DOG BODY - More rounded and cute */}
            <ellipse 
              cx="40" 
              cy="50" 
              rx="20" 
              ry="18" 
              fill="url(#dogBodyGradient)"
              stroke="none"
            />
            
            {/* ✅ DOG HEAD - Bigger and rounder for cuteness */}
            <circle 
              cx="40" 
              cy="32" 
              r="16" 
              fill="url(#dogHeadGradient)"
              stroke="none"
            />
            
            {/* ✅ DOG EARS - Floppy and adorable */}
            <motion.ellipse 
              cx="28" 
              cy="24" 
              rx="7" 
              ry="12" 
              fill="url(#dogEarGradient)"
              stroke="none"
              animate={
                state === 'happy' || state === 'excited' ? 
                { rotate: [-15, 15, -15] } : 
                {}
              }
              transition={{ duration: 0.4 }}
              style={{ transformOrigin: '28px 36px' }}
            />
            <motion.ellipse 
              cx="52" 
              cy="24" 
              rx="7" 
              ry="12" 
              fill="url(#dogEarGradient)"
              stroke="none"
              animate={
                state === 'happy' || state === 'excited' ? 
                { rotate: [15, -15, 15] } : 
                {}
              }
              transition={{ duration: 0.4 }}
              style={{ transformOrigin: '52px 36px' }}
            />
            
            {/* ✅ INNER EAR DETAILS */}
            <ellipse cx="28" cy="26" rx="3" ry="6" fill="url(#innerEarGradient)" />
            <ellipse cx="52" cy="26" rx="3" ry="6" fill="url(#innerEarGradient)" />
            
            {/* ✅ DOG EYES - Bigger and more expressive */}
            <motion.circle 
              cx="33" 
              cy="28" 
              r="4" 
              fill="#FFFFFF"
              stroke="none"
              animate={
                state === 'thinking' ? { scaleY: [1, 0.2, 1] } :
                state === 'excited' ? { scale: [1, 1.3, 1] } :
                {}
              }
              transition={{ duration: 0.5, repeat: state === 'thinking' ? 3 : 0 }}
            />
            <circle cx="33" cy="28" r="2" fill="#1F2937" />
            <circle cx="34" cy="27" r="0.8" fill="#FFFFFF" opacity="0.8" />
            
            <motion.circle 
              cx="47" 
              cy="28" 
              r="4" 
              fill="#FFFFFF"
              stroke="none"
              animate={
                state === 'thinking' ? { scaleY: [1, 0.2, 1] } :
                state === 'excited' ? { scale: [1, 1.3, 1] } :
                {}
              }
              transition={{ duration: 0.5, repeat: state === 'thinking' ? 3 : 0 }}
            />
            <circle cx="47" cy="28" r="2" fill="#1F2937" />
            <circle cx="48" cy="27" r="0.8" fill="#FFFFFF" opacity="0.8" />
            
            {/* ✅ DOG NOSE - Heart-shaped for extra cuteness */}
            <path 
              d="M 40 34 C 38 32, 36 33, 37 35 C 37 36, 38 36, 40 36 C 42 36, 43 36, 43 35 C 44 33, 42 32, 40 34 Z"
              fill="#EC4899"
            />
            
            {/* ✅ DOG MOUTH - Always smiling */}
            <motion.path 
              d="M 34 38 Q 40 42 46 38"
              stroke="#7C3AED"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              animate={
                state === 'happy' || state === 'excited' ? 
                { d: "M 32 38 Q 40 44 48 38" } :
                state === 'speaking' ? 
                { d: ["M 34 38 Q 40 42 46 38", "M 34 40 Q 40 44 46 40", "M 34 38 Q 40 42 46 38"] } :
                {}
              }
              transition={{ duration: 0.3 }}
            />
            
            {/* ✅ DOG TONGUE - Appears when happy/excited */}
            <AnimatePresence>
              {(state === 'happy' || state === 'excited') && (
                <motion.ellipse
                  cx="40"
                  cy="42"
                  rx="3"
                  ry="5"
                  fill="#F472B6"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>
            
            {/* ✅ DOG TAIL - Wagging when happy */}
            <motion.path 
              d="M 58 52 Q 68 45 65 58"
              stroke="url(#tailGradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              animate={
                state === 'happy' || state === 'excited' ? 
                { d: ["M 58 52 Q 68 45 65 58", "M 58 52 Q 72 40 70 55", "M 58 52 Q 68 45 65 58"] } :
                {}
              }
              transition={{ duration: 0.3, repeat: (state === 'happy' || state === 'excited') ? Infinity : 0 }}
            />
            
            {/* ✅ CUTE CHEEK BLUSH */}
            <circle cx="24" cy="34" r="3" fill="#F8BBD9" opacity="0.6" />
            <circle cx="56" cy="34" r="3" fill="#F8BBD9" opacity="0.6" />
            
            {/* ✅ MAGICAL SPARKLES when excited */}
            <AnimatePresence>
              {state === 'excited' && (
                <>
                  <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 180, 360] }}
                    transition={{ duration: 0.8, repeat: 3, delay: 0 }}
                  >
                    <path d="M 20 20 L 22 18 L 24 20 L 22 22 Z" fill="#FDE047" />
                    <path d="M 18 22 L 24 22" stroke="#FDE047" strokeWidth="1" />
                    <path d="M 22 18 L 22 24" stroke="#FDE047" strokeWidth="1" />
                  </motion.g>
                  
                  <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, -180, -360] }}
                    transition={{ duration: 0.8, repeat: 3, delay: 0.3 }}
                  >
                    <path d="M 60 18 L 62 16 L 64 18 L 62 20 Z" fill="#FDE047" />
                    <path d="M 58 20 L 64 20" stroke="#FDE047" strokeWidth="1" />
                    <path d="M 62 16 L 62 22" stroke="#FDE047" strokeWidth="1" />
                  </motion.g>
                  
                  <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 90, 180] }}
                    transition={{ duration: 0.8, repeat: 3, delay: 0.6 }}
                  >
                    <path d="M 65 35 L 67 33 L 69 35 L 67 37 Z" fill="#FDE047" />
                    <path d="M 63 37 L 69 37" stroke="#FDE047" strokeWidth="1" />
                    <path d="M 67 33 L 67 39" stroke="#FDE047" strokeWidth="1" />
                  </motion.g>
                </>
              )}
            </AnimatePresence>
            
            {/* ✅ GRADIENT DEFINITIONS - Beautiful color schemes */}
            <defs>
              {/* Magical aura */}
              <radialGradient id="magicalAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C084FC" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.1" />
              </radialGradient>
              
              {/* Dog body gradient */}
              <linearGradient id="dogBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
              
              {/* Dog head gradient */}
              <linearGradient id="dogHeadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="50%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
              
              {/* Dog ear gradient */}
              <linearGradient id="dogEarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#6D28D9" />
              </linearGradient>
              
              {/* Inner ear gradient */}
              <linearGradient id="innerEarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F8BBD9" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
              
              {/* Tail gradient */}
              <linearGradient id="tailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Mascot;