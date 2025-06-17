import React from "react";
import { motion } from "framer-motion";
import { Star, Heart, Sparkles, Zap } from "lucide-react";

interface KidFriendlyLoaderProps {
  title?: string;
  subtitle?: string;
  loadingSteps?: Array<{
    label: string;
    isComplete: boolean;
  }>;
  showSteps?: boolean;
}

const KidFriendlyLoader: React.FC<KidFriendlyLoaderProps> = ({
  title = "Loading Your Adventure",
  subtitle = "Preparing amazing content just for you...",
  loadingSteps = [],
  showSteps = false,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center relative overflow-hidden">
      {/* Floating Background Elements */}
      <motion.div
        className="absolute top-20 left-20 text-6xl"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        🐱
      </motion.div>

      <motion.div
        className="absolute top-32 right-32 text-5xl"
        animate={{
          y: [0, -15, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        🐭
      </motion.div>

      <motion.div
        className="absolute bottom-32 left-16 text-4xl"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        🎯
      </motion.div>

      <motion.div
        className="absolute bottom-20 right-24 text-5xl"
        animate={{
          y: [0, -25, 0],
          rotate: [0, -15, 15, 0],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        🎨
      </motion.div>

      {/* Floating Stars */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400"
          style={{
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        >
          <Star className="w-6 h-6" />
        </motion.div>
      ))}

      {/* Main Loading Content */}
      <motion.div
        className="text-center z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated Main Character */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Outer Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-purple-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* Spinning Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Center Character */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-6xl"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            🌟
          </motion.div>

          {/* Orbiting Elements */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <div className="relative w-full h-full">
              <motion.div
                className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-2xl"
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎈
              </motion.div>
              <motion.div
                className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-2xl"
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.25 }}
              >
                🧸
              </motion.div>
              <motion.div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-2xl"
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              >
                🎮
              </motion.div>
              <motion.div
                className="absolute top-1/2 -left-2 transform -translate-y-1/2 text-2xl"
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.75 }}
              >
                🚀
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Title */}
        <motion.h2
          className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {title}
        </motion.h2>

        {/* Loading Steps */}
        {showSteps && loadingSteps.length > 0 && (
          <motion.div
            className="space-y-3 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {loadingSteps.map((step, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.2 }}
              >
                <motion.div
                  className={`w-3 h-3 rounded-full ${
                    step.isComplete ? "bg-green-500" : "bg-gray-300"
                  }`}
                  animate={step.isComplete ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
                <span className="text-sm text-gray-600 font-medium">
                  {step.label}
                </span>
                {step.isComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart
                      className="w-4 h-4 text-green-500"
                      fill="currentColor"
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Subtitle */}
        <motion.p
          className="text-gray-600 text-lg font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {subtitle}
        </motion.p>

        {/* Fun Loading Dots */}
        <motion.div
          className="flex justify-center space-x-2 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        {/* Encouraging Messages */}
        <motion.div
          className="mt-6 text-sm text-purple-600 font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            key="message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            ✨ Almost ready for your adventure! ✨
          </motion.div>
        </motion.div>

        {/* Fun Progress Bar */}
        <motion.div
          className="mt-8 w-64 mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <div className="w-full bg-purple-100 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "reverse",
              }}
            />
          </div>
          <p className="text-xs text-center text-gray-500 mt-2">
            Loading amazing content...
          </p>
        </motion.div>
      </motion.div>

      {/* Bottom Decoration */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-purple-100 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      />
    </div>
  );
};

export default KidFriendlyLoader;
