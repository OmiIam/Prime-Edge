interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Abstract Logo SVG */}
      <div className={`${sizeClasses[size]} flex-shrink-0 transition-transform duration-300 hover:scale-110`}>
        <svg 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          {/* Outer ring */}
          <circle 
            cx="20" 
            cy="20" 
            r="18" 
            stroke="currentColor" 
            strokeWidth="2" 
            className="text-white/20"
          />
          
          {/* Inner geometric pattern */}
          <path 
            d="M8 20 L20 8 L32 20 L20 32 Z" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            className="text-blue-500"
          />
          
          {/* Center accent diamond */}
          <path 
            d="M14 20 L20 14 L26 20 L20 26 Z" 
            fill="currentColor" 
            className="text-blue-500"
          />
          
          {/* Corner accent dots */}
          <circle cx="20" cy="8" r="2" fill="currentColor" className="text-blue-400" />
          <circle cx="32" cy="20" r="2" fill="currentColor" className="text-blue-400" />
          <circle cx="20" cy="32" r="2" fill="currentColor" className="text-blue-400" />
          <circle cx="8" cy="20" r="2" fill="currentColor" className="text-blue-400" />
          
          {/* Subtle gradient overlay */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(147, 197, 253)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="url(#logoGradient)" />
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <h1 className={`${textSizeClasses[size]} font-bold text-white`}>
          Prime Edge <span className="text-prime-accent">Banking</span>
        </h1>
      )}
    </div>
  );
}