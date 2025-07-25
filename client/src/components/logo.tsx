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
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Minimalist Logo */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Simple geometric mark */}
          <rect 
            x="6" 
            y="6" 
            width="20" 
            height="20" 
            rx="2" 
            fill="currentColor" 
            className="text-white"
          />
          <rect 
            x="10" 
            y="10" 
            width="12" 
            height="12" 
            rx="1" 
            fill="currentColor" 
            className="text-slate-800"
          />
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <div className={`${textSizeClasses[size]} font-medium text-white tracking-tight`}>
          Prime Edge Banking
        </div>
      )}
    </div>
  );
}