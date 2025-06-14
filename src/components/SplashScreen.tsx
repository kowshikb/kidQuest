import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "backOut" }}
        className="text-center"
      >
        <motion.div
          className="inline-block bg-yellow-400 text-purple-800 p-6 rounded-full mb-6 shadow-2xl"
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        >
          <Sparkles size={64} />
        </motion.div>
        <motion.h1 
          className="text-5xl md:text-7xl font-bold text-white mb-3 font-gaegu"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        >
          KidQuest Champions
        </motion.h1>
        <motion.p 
          className="text-xl text-yellow-300 font-baloo"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          Loading Your Adventure...
        </motion.p>
      </motion.div>
      {/* Floating stars */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-300"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            fontSize: `${Math.random() * 1.5 + 0.5}rem`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.7, 0], scale: 1 }}
          transition={{
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 1.5,
            repeat: Infinity,
            repeatType: 'loop',
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );
};

export default SplashScreen;