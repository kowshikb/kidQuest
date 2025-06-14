import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins as Coin } from 'lucide-react';

interface CoinCounterProps {
  coins: number;
}

const CoinCounter: React.FC<CoinCounterProps> = ({ coins }) => {
  const [prevCoins, setPrevCoins] = useState(coins);
  const [isAnimating, setIsAnimating] = useState(false);
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
    <motion.div
      ref={counterRef}
      className="flex items-center bg-yellow-400 text-purple-900 px-3 py-1 rounded-full font-bold shadow-md"
      variants={counterVariants}
      animate={isAnimating ? 'animate' : 'idle'}
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
  );
};

export default CoinCounter;