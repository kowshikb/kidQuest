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
            className="absolute bottom-full mb-3 p-3 bg-white rounded-2xl shadow-lg max-w-xs right-0"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            style={{ 
              transformOrigin: 'bottom right',
              border: '2px solid #8B5CF6'
            }}
          >
            <div 
              className="absolute bottom-[-8px] right-4 w-3 h-3 bg-white rotate-45"
              style={{ border: '0 solid transparent', borderRight: '2px solid #8B5CF6', borderBottom: '2px solid #8B5CF6' }}
            ></div>
            <p className="text-purple-800 text-xs">{getCurrentMessage()}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Cute Dog Mascot */}
      <motion.div
        className="cursor-pointer"
        onClick={handleMascotClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="relative bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full overflow-hidden shadow-lg border-3 border-yellow-300 w-16 h-16 flex items-center justify-center"
          animate={
            state === 'idle' ? { y: [0, -3, 0] } :
            state === 'happy' ? { rotate: [-3, 3, -3, 3, 0] } :
            state === 'excited' ? { scale: [1, 1.1, 1] } :
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
        >
          {/* Cute Dog Face */}
          <div className="relative flex flex-col items-center">
            {/* Dog Ears */}
            <div className="absolute -top-2 flex space-x-4">
              <motion.div 
                className="w-3 h-4 bg-purple-700 rounded-full transform -rotate-12"
                animate={
                  state === 'happy' || state === 'excited' ? { rotate: [-25, -5, -25] } : {}
                }
                transition={{ duration: 0.3 }}
              />
              <motion.div 
                className="w-3 h-4 bg-purple-700 rounded-full transform rotate-12"
                animate={
                  state === 'happy' || state === 'excited' ? { rotate: [25, 5, 25] } : {}
                }
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Dog Eyes */}
            <div className="flex space-x-3 mb-1 mt-1">
              <motion.div 
                className="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center"
                animate={
                  state === 'thinking' ? { scaleY: [1, 0.3, 1] } :
                  state === 'excited' ? { scale: [1, 1.2, 1] } :
                  {}
                }
                transition={{ duration: 0.5, repeat: state === 'thinking' ? 3 : 0 }}
              >
                <div className="w-1 h-1 bg-black rounded-full"></div>
              </motion.div>
              <motion.div 
                className="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center"
                animate={
                  state === 'thinking' ? { scaleY: [1, 0.3, 1] } :
                  state === 'excited' ? { scale: [1, 1.2, 1] } :
                  {}
                }
                transition={{ duration: 0.5, repeat: state === 'thinking' ? 3 : 0 }}
              >
                <div className="w-1 h-1 bg-black rounded-full"></div>
              </motion.div>
            </div>
            
            {/* Dog Nose */}
            <div className="w-1.5 h-1 bg-pink-400 rounded-full mb-1"></div>
            
            {/* Dog Mouth */}
            <motion.div 
              className="w-4 h-2 bg-white rounded-full overflow-hidden"
              animate={
                state === 'happy' || state === 'excited' ? { height: 6, y: 1 } :
                state === 'speaking' ? { scaleY: [1, 1.3, 1], y: 1 } :
                {}
              }
              transition={{ duration: 0.3 }}
            >
              <div className="w-full h-1/2 bg-pink-400 rounded-b-full"></div>
            </motion.div>

            {/* Dog Tongue (when happy/excited) */}
            <AnimatePresence>
              {(state === 'happy' || state === 'excited') && (
                <motion.div
                  className="w-1 h-2 bg-pink-500 rounded-full mt-0.5"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Sparkle effect when excited */}
          <AnimatePresence>
            {state === 'excited' && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                    style={{
                      top: `${20 + i * 15}%`,
                      left: `${20 + i * 20}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.1,
                      repeat: 2,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Mascot;