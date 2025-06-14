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
    "The more quests you complete, the more magic you unlock!",
    ""
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
            className="absolute bottom-full mb-3 p-4 bg-white rounded-2xl shadow-lg max-w-xs right-0"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            style={{ 
              transformOrigin: 'bottom right',
              border: '3px solid #8B5CF6'
            }}
          >
            <div 
              className="absolute bottom-[-12px] right-6 w-4 h-4 bg-white rotate-45"
              style={{ border: '0 solid transparent', borderRight: '3px solid #8B5CF6', borderBottom: '3px solid #8B5CF6' }}
            ></div>
            <p className="text-purple-800 text-sm">{getCurrentMessage()}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mascot character */}
      <motion.div
        className="cursor-pointer"
        onClick={handleMascotClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="relative bg-purple-600 rounded-full overflow-hidden shadow-lg border-4 border-yellow-300 w-24 h-24 flex items-center justify-center"
          animate={
            state === 'idle' ? { y: [0, -5, 0] } :
            state === 'happy' ? { rotate: [-5, 5, -5, 5, 0] } :
            state === 'excited' ? { scale: [1, 1.2, 1] } :
            state === 'thinking' ? { x: [0, 3, -3, 0] } :
            state === 'speaking' ? { y: [0, -3, 0, -3, 0] } :
            {}
          }
          transition={{ 
            duration: state === 'idle' ? 3 : 0.5, 
            repeat: state === 'idle' ? Infinity : 0,
            repeatType: "reverse",
            ease: "easeInOut" 
          }}
        >
          {/* Mascot face - using simple shapes for a cute character */}
          <div className="relative flex flex-col items-center">
            {/* Eyes */}
            <div className="flex space-x-5 mb-1">
              <motion.div 
                className="w-4 h-4 bg-white rounded-full flex items-center justify-center"
                animate={
                  state === 'thinking' ? { scaleY: [1, 0.3, 1] } :
                  state === 'excited' ? { scale: [1, 1.2, 1] } :
                  {}
                }
                transition={{ duration: 0.5, repeat: state === 'thinking' ? 3 : 0 }}
              >
                <div className="w-2 h-2 bg-black rounded-full"></div>
              </motion.div>
              <motion.div 
                className="w-4 h-4 bg-white rounded-full flex items-center justify-center"
                animate={
                  state === 'thinking' ? { scaleY: [1, 0.3, 1] } :
                  state === 'excited' ? { scale: [1, 1.2, 1] } :
                  {}
                }
                transition={{ duration: 0.5, repeat: state === 'thinking' ? 3 : 0 }}
              >
                <div className="w-2 h-2 bg-black rounded-full"></div>
              </motion.div>
            </div>
            
            {/* Mouth */}
            <motion.div 
              className="w-8 h-4 bg-white rounded-full overflow-hidden"
              animate={
                state === 'happy' || state === 'excited' ? { height: 8, y: 2 } :
                state === 'speaking' ? { scaleY: [1, 1.5, 1], y: 2 } :
                {}
              }
              transition={{ duration: 0.3 }}
            >
              <div className="w-full h-1/2 bg-pink-400 rounded-b-full"></div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Mascot;