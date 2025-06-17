import React from "react";
import { motion } from "framer-motion";

interface UnifiedBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const UnifiedBackground: React.FC<UnifiedBackgroundProps> = ({
  children,
  className = "",
}) => {
  return (
    <motion.div
      className={`min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 relative overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Fixed Background Layer - Unified across all pages */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 -z-10"></div>

      {/* Subtle floating decoration elements */}
      <div className="fixed inset-0 pointer-events-none opacity-30 -z-5">
        {/* Top area decorations */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-purple-300 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-32 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-40 left-1/3 w-1 h-1 bg-indigo-300 rounded-full animate-pulse delay-500"></div>

        {/* Middle area decorations */}
        <div className="absolute top-1/2 left-16 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 right-20 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-1500"></div>

        {/* Bottom area decorations */}
        <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-indigo-300 rounded-full animate-pulse delay-3000"></div>
        <div className="absolute bottom-20 right-1/3 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse delay-2500"></div>
        <div className="absolute bottom-40 right-16 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default UnifiedBackground;
