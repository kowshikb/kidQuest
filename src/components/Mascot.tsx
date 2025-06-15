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
    "Great job, explorer!",
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
    "The more quests you complete, the more magic you unlock!"
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
    playSound('click');
    
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
            className="absolute bottom-full mb-2 p-2 bg-white rounded-xl shadow-lg max-w-xs right-0"
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
            <p className="text-purple-800 text-xs">{getCurrentMessage()}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ✅ COMPLETELY NEW: Transparent, Cute Dog Mascot */}
      <motion.div
        className="cursor-pointer relative"
        onClick={handleMascotClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* ✅ TRANSPARENT BACKGROUND with subtle glow */}
        <motion.div
          className="relative w-16 h-16 flex items-center justify-center"
          animate={
            state === 'idle' ? { y: [0, -2, 0] } :
            state === 'happy' ? { rotate: [-2, 2, -2, 2, 0] } :
            state === 'excited' ? { scale: [1, 1.15, 1] } :
            state === 'thinking' ? { x: [0, 1, -1, 0] } :
            state === 'speaking' ? { y: [0, -1, 0, -1, 0] } :
            {}
          }
          transition={{ 
            duration: state === 'idle' ? 3 : 0.5, 
            repeat: state === 'idle' ? Infinity : 0,
            repeatType: "reverse",
            ease: "easeInOut" 
          }}
          style={{
            // ✅ TRANSPARENT with subtle purple glow
            background: 'transparent',
            filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))',
          }}
        >
          {/* ✅ CUTE DOG DESIGN - SVG for crisp, scalable graphics */}
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 64 64" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Dog Body */}
            <ellipse 
              cx="32" 
              cy="42" 
              rx="18" 
              ry="16" 
              fill="url(#dogBodyGradient)"
              stroke="#7C3AED"
              strokeWidth="2"
            />
            
            {/* Dog Head */}
            <circle 
              cx="32" 
              cy="24" 
              r="14" 
              fill="url(#dogHeadGradient)"
              stroke="#7C3AED"
              strokeWidth="2"
            />
            
            {/* Dog Ears */}
            <motion.ellipse 
              cx="22" 
              cy="18" 
              rx="6" 
              ry="10" 
              fill="url(#dogEarGradient)"
              stroke="#7C3AED"
              strokeWidth="1.5"
              animate={
                state === 'happy' || state === 'excited' ? 
                { rotate: [-10, 10, -10] } : 
                {}
              }
              transition={{ duration: 0.3 }}
              style={{ transformOrigin: '22px 28px' }}
            />
            <motion.ellipse 
              cx="42" 
              cy="18" 
              rx="6" 
              ry="10" 
              fill="url(#dogEarGradient)"
              stroke="#7C3AED"
              strokeWidth="1.5"
              animate={
                state === 'happy' || state === 'excited' ? 
                { rotate: [10, -10, 10] } : 
                {}
              }
              transition={{ duration: 0.3 }}
              style={{ transformOrigin: '42px 28px' }}
            />
            
            {/* Dog Eyes */}
            <motion.circle 
              cx="27" 
              cy="22" 
              r="3" 
              fill="#FFFFFF"
              stroke="#7C3AED"
              strokeWidth="1"
              animate={
                state === 'thinking' ? { scaleY: [1, 0.3, 1] } :
                state === 'excited' ? { scale: [1, 1.2, 1] } :
                {}
              }
              transition={{ duration: 0.5, repeat: state === 'thinking' ? 3 : 0 }}
            />
            <circle cx="27" cy="22" r="1.5" fill="#1F2937" />
            
            <motion.circle 
              cx="37" 
              cy="22" 
              r="3" 
              fill="#FFFFFF"
              stroke="#7C3AED"
              strokeWidth="1"
              animate={
                state === 'thinking' ? { scaleY: [1, 0.3, 1] } :
                state === 'excited' ? { scale: [1, 1.2, 1] } :
                {}
              }
              transition={{ duration: 0.5, repeat: state === 'thinking' ? 3 : 0 }}
            />
            <circle cx="37" cy="22" r="1.5" fill="#1F2937" />
            
            {/* Dog Nose */}
            <ellipse cx="32" cy="26" rx="2" ry="1.5" fill="#EC4899" />
            
            {/* Dog Mouth */}
            <motion.path 
              d="M 28 30 Q 32 34 36 30"
              stroke="#7C3AED"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              animate={
                state === 'happy' || state === 'excited' ? 
                { d: "M 26 30 Q 32 36 38 30" } :
                state === 'speaking' ? 
                { d: ["M 28 30 Q 32 34 36 30", "M 28 32 Q 32 36 36 32", "M 28 30 Q 32 34 36 30"] } :
                {}
              }
              transition={{ duration: 0.3 }}
            />
            
            {/* Dog Tongue (when happy/excited) */}
            <AnimatePresence>
              {(state === 'happy' || state === 'excited') && (
                <motion.ellipse
                  cx="32"
                  cy="35"
                  rx="2"
                  ry="4"
                  fill="#F472B6"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>
            
            {/* Dog Tail */}
            <motion.path 
              d="M 48 45 Q 55 40 52 50"
              stroke="#7C3AED"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              animate={
                state === 'happy' || state === 'excited' ? 
                { d: ["M 48 45 Q 55 40 52 50", "M 48 45 Q 58 35 55 45", "M 48 45 Q 55 40 52 50"] } :
                {}
              }
              transition={{ duration: 0.4, repeat: (state === 'happy' || state === 'excited') ? Infinity : 0 }}
            />
            
            {/* Sparkle effects when excited */}
            <AnimatePresence>
              {state === 'excited' && (
                <>
                  <motion.circle
                    cx="18"
                    cy="15"
                    r="1"
                    fill="#FDE047"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                    transition={{ duration: 0.6, repeat: 3, delay: 0 }}
                  />
                  <motion.circle
                    cx="46"
                    cy="12"
                    r="1"
                    fill="#FDE047"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                    transition={{ duration: 0.6, repeat: 3, delay: 0.2 }}
                  />
                  <motion.circle
                    cx="50"
                    cy="25"
                    r="1"
                    fill="#FDE047"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                    transition={{ duration: 0.6, repeat: 3, delay: 0.4 }}
                  />
                </>
              )}
            </AnimatePresence>
            
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="dogBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
              <linearGradient id="dogHeadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
              <linearGradient id="dogEarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#5B21B6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Mascot;