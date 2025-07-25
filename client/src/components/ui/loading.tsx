import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Logo from "@/components/logo";

interface LoadingProps {
  variant?: "default" | "fullscreen" | "inline" | "minimal";
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  className?: string;
}

export function Loading({ 
  variant = "default", 
  size = "md", 
  message = "Loading...", 
  className 
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const containerClasses = {
    default: "flex flex-col items-center justify-center p-8 space-y-4",
    fullscreen: "fixed inset-0 bg-prime-navy/95 backdrop-blur-sm flex flex-col items-center justify-center z-50",
    inline: "flex items-center space-x-3 p-4",
    minimal: "flex items-center justify-center"
  };

  if (variant === "minimal") {
    return (
      <div className={cn(containerClasses[variant], className)}>
        <motion.div
          className={cn(
            "border-2 border-transparent border-t-prime-accent rounded-full",
            sizeClasses[size]
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn(containerClasses[variant], className)}>
        <motion.div
          className={cn(
            "border-2 border-transparent border-t-prime-accent rounded-full",
            sizeClasses[size]
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    );
  }

  return (
    <div className={cn(containerClasses[variant], className)}>
      {/* Animated Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <Logo size="lg" showText={false} />
        
        {/* Pulse Ring */}
        <motion.div
          className="absolute inset-0 border-2 border-prime-accent/30 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 0.3, 0.7]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        
        {/* Outer Ring */}
        <motion.div
          className="absolute inset-0 border-2 border-transparent border-t-prime-accent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Loading Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center space-y-2"
      >
        <p className="text-lg font-semibold text-foreground">{message}</p>
        
        {/* Animated Dots */}
        <div className="flex items-center justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-prime-accent rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Progress Bar (for fullscreen variant) */}
      {variant === "fullscreen" && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="w-64 h-1 bg-muted rounded-full overflow-hidden mt-6"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-prime-accent to-blue-600 rounded-full"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

export function LoadingSpinner({ 
  size = "md", 
  className 
}: { 
  size?: "sm" | "md" | "lg"; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: "w-4 h-4 border",
    md: "w-6 h-6 border-2", 
    lg: "w-8 h-8 border-2"
  };

  return (
    <motion.div
      className={cn(
        "border-transparent border-t-prime-accent rounded-full",
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function LoadingDots({ 
  size = "md", 
  className 
}: { 
  size?: "sm" | "md" | "lg"; 
  className?: string; 
}) {
  const dotSizes = {
    sm: "w-1 h-1",
    md: "w-2 h-2",
    lg: "w-3 h-3"
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn("bg-prime-accent rounded-full", dotSizes[size])}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

export function LoadingPulse({ 
  className 
}: { 
  className?: string; 
}) {
  return (
    <motion.div
      className={cn(
        "w-12 h-12 bg-prime-accent/20 border-2 border-prime-accent rounded-full flex items-center justify-center",
        className
      )}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Logo size="sm" showText={false} />
    </motion.div>
  );
}