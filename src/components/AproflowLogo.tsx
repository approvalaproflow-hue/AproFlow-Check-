import React from "react";

interface AproflowLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "light" | "dark";
}

export const AproflowLogo: React.FC<AproflowLogoProps> = ({
  className = "",
  iconOnly = false,
  size = "md",
  theme = "dark",
}) => {
  // Sizing styles
  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-14 w-14",
    xl: "h-24 w-24",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-7xl",
  };

  const primaryColor = theme === "dark" ? "#FFFFFF" : "#0F172A"; // White or deep Slate

  return (
    <div className={`flex items-center space-x-3.5 select-none ${className}`} id="aproflow-brand-logo">
      {/* Brand Icon - Highly precise vector recreation matching the actual physical logo */}
      <svg
        viewBox="0 0 100 100"
        className={`${iconSizes[size]} shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* White / Slate 'A' Structure - Perfect aspect ratio and exact custom cutoff */}
        <path
          d="M 17 84 L 50 16 L 73 62 L 64 53 L 50 47 L 31 84 Z"
          fill={primaryColor}
        />
        
        {/* Golden Orange Triangle at base inner A */}
        <polygon
          points="33,84 41,68 49,84"
          fill="#F5B000"
        />
        
        {/* Vibrant Mint/Teal Green Checkmark crossing the right gap with perfect dynamic slant */}
        <path
          d="M 48 70 L 57 82 L 85 45 L 79 40 L 57 69 L 48 59 Z"
          fill="#10B981"
        />
      </svg>

      {/* Brand Wordmark text */}
      {!iconOnly && (
        <div className="flex items-center tracking-wide font-black font-sans leading-none">
          <span
            className={`${textSizes[size]} font-extrabold tracking-tight`}
            style={{ color: primaryColor }}
          >
            APRO
          </span>
          <span
            className={`${textSizes[size]} font-extrabold tracking-tight`}
            style={{ color: "#F5B000" }}
          >
            FLOW
          </span>
        </div>
      )}
    </div>
  );
};
