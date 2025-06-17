import React from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverRaise?: boolean;
  size?: "sm" | "md" | "lg";
  gradient?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  onClick,
  hoverRaise = true,
  size = "md",
  gradient,
}) => {
  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const baseClasses = `
    bg-white/70 backdrop-blur-xl border border-white/30 
    rounded-2xl shadow-xl shadow-black/5
    ${sizeClasses[size]}
    ${onClick ? "cursor-pointer" : ""}
    ${className}
  `;

  const hoverClasses = hoverRaise
    ? "hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10"
    : "";

  const gradientOverlay = gradient ? (
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 rounded-2xl`}
    />
  ) : null;

  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses} transition-all duration-300 relative overflow-hidden`}
      onClick={onClick}
      whileHover={hoverRaise ? { scale: 1.02, y: -4 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {gradientOverlay}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default GlassCard;
