import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins as Coin } from 'lucide-react';

interface CoinCounterProps {
  coins: number;
}

const CoinCounter: React.FC<CoinCounterProps> = ({ coins }) => {
  const [prevCoins, setPrevCoins] = useState(coins);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);

  // Detect changes in coins and trigger animation
  useEffect(() => {
    if (coins > prevCoins) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
    setPrevCoins(coins);
  }, [coins, prevCoins]);

  // Animation variants for the counter
  const counterVariants = {
    idle: { scale: 1 },
    animate: { 
      scale: [1, 1.2, 1],
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="relative">
      <motion.div
        ref={counterRef}
        className="flex items-center bg-yellow-400 text-purple-900 px-3 py-1 rounded-full font-bold shadow-md cursor-help"
        variants={counterVariants}
        animate={isAnimating ? 'animate' : 'idle'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <Coin className="mr-1" size={18} />
        <AnimatePresence mode="wait">
          <motion.span
            key={coins}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="min-w-[1.5rem] text-center"
          >
            {coins}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* Tooltip - positioned below the coin counter with app theme colors */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute top-full mt-2 right-0 z-50"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.2, ease: "backOut" }}
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl shadow-xl border-2 border-purple-300 text-sm whitespace-nowrap">
              <div className="font-bold text-yellow-300 flex items-center">
                <Coin size={16} className="mr-2" />
                Your Magic Coins
              </div>
              <div className="text-purple-100 text-xs mt-1">
                Complete quests to earn more magical rewards!
              </div>
              {/* Tooltip arrow positioned at the top for below positioning */}
              <div className="absolute bottom-full right-4">
                <div className="border-4 border-transparent border-b-purple-600"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoinCounter;