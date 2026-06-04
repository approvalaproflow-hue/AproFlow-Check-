import React, { useEffect, useState } from "react";

interface SplashLoaderProps {
  onComplete: () => void;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0); 
  const [loadingText, setLoadingText] = useState<string>("Initializing Secure Workflow...");
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    // Session-check to guarantee splash plays only once per session
    let alreadyPlayed = "false";
    try {
      alreadyPlayed = sessionStorage.getItem("aproflow_splash_played") || "false";
    } catch (e) {
      console.warn("Storage check failed:", e);
    }
    if (alreadyPlayed === "true") {
      setIsVisible(false);
      onComplete();
      return;
    }

    // Phase 1: 1.3s - Drawing checkmark only. Status text update.
    const textTimer1 = setTimeout(() => {
      setLoadingText("Verifying Approval Authorities...");
    }, 1300);

    const stepTimer1 = setTimeout(() => {
      setStep(1); // Assemble White A Frame & Yellow Triangle
    }, 1300);

    // Phase 2: 2.5s - Brand wordmark letter-by-letter reveal
    const textTimer2 = setTimeout(() => {
      setLoadingText("Assembling Enterprise Nodes...");
    }, 2500);

    const stepTimer2 = setTimeout(() => {
      setStep(2); // Wordmark entrance
    }, 2500);

    // Phase 3: 3.8s - Glow sweep & Loading text finalize
    const textTimer3 = setTimeout(() => {
      setLoadingText("Syncing Active Workflows...");
    }, 3800);

    const stepTimer3 = setTimeout(() => {
      setStep(3); // Glow sweep & loading indicator stabilized
    }, 3800);

    // Phase 4: 4.8s - Fade out starts (0.7s duration)
    const stepTimer4 = setTimeout(() => {
      setStep(4); // Fade out initiated
    }, 4800);

    // Phase 5: 5.5s - Fire onComplete and unmount
    const stepTimer5 = setTimeout(() => {
      try {
        sessionStorage.setItem("aproflow_splash_played", "true");
      } catch (e) {
        console.warn("Storage write failed:", e);
      }
      setIsVisible(false);
      onComplete();
    }, 5500);

    return () => {
      clearTimeout(textTimer1);
      clearTimeout(textTimer2);
      clearTimeout(textTimer3);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
      clearTimeout(stepTimer5);
    };
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  const aproLetters = ["A", "P", "R", "O"];
  const flowLetters = ["F", "L", "O", "W"];

  return (
    <div
      id="aproflow-supreme-splash"
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden transition-all duration-[750ms] ease-in-out ${
        step === 4 ? "opacity-0 scale-[0.98] blur-xs pointer-events-none" : "opacity-100"
      }`}
      style={{
        background: "radial-gradient(circle at center, #070D1F 0%, #02040A 100%)",
        willChange: "opacity, transform, filter",
      }}
    >
      {/* Heavy-duty custom style engine for hardware-accelerated 60 FPS transitions */}
      <style>{`
        /* Hardware Acceleration Core */
        .premium-gpu-stack {
          backface-visibility: hidden;
          perspective: 1000px;
          transform: translate3d(0, 0, 0);
          will-change: transform, opacity, filter;
        }

        /* 1. Low-frequency undulating background corporate lights */
        .ambient-backlight {
          position: absolute;
          width: 650px;
          height: 650px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.055) 0%, rgba(245, 176, 0, 0.02) 45%, transparent 70%);
          border-radius: 50%;
          animation: waveBacklight 14s ease-in-out infinite alternate;
          filter: blur(48px);
          pointer-events: none;
        }

        @keyframes waveBacklight {
          0% {
            transform: translate3d(-60px, -30px, 0) scale(1);
          }
          50% {
            transform: translate3d(60px, 40px, 0) scale(1.1);
          }
          100% {
            transform: translate3d(-30px, 60px, 0) scale(0.95);
          }
        }

        /* 2. Custom micro-fintech grid texture */
        .fintech-grid-overlay {
          background-image: radial-gradient(rgba(30, 52, 92, 0.22) 1.2px, transparent 1.2px);
          background-size: 30px 30px;
          animation: driftGrid 60s linear infinite;
        }

        @keyframes driftGrid {
          from {
            background-position: 0px 0px;
          }
          to {
            background-position: 30px 30px;
          }
        }

        /* 3. Drawing checkmark via our dynamic mask */
        .sketch-checkmark-mask {
          stroke-dasharray: 85;
          stroke-dashoffset: 85;
          animation: revealFilledPath 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
        }

        @keyframes revealFilledPath {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* 4. Elegant checkmark initial pulse glow to capture eye instantly */
        .checkmark-spark {
          opacity: 0;
          transform: scale(0);
          animation: sparkEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes sparkEntrance {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.4);
            filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.8));
          }
          100% {
            opacity: 0;
            transform: scale(1);
            filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.3));
          }
        }

        /* 5. Left leg assembly of White 'A' */
        .build-left-a {
          opacity: 0;
          transform: translate3d(-18px, 22px, 0) scale(0.95);
          animation: assembleLeftA 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes assembleLeftA {
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        /* 6. Right leg assembly of White 'A' */
        .build-right-a {
          opacity: 0;
          transform: translate3d(18px, 22px, 0) scale(0.95);
          animation: assembleRightA 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        }

        @keyframes assembleRightA {
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        /* 7. Yellow triangle assembly */
        .build-yellow-triangle {
          opacity: 0;
          transform: scale(0.6) translate3d(0, 12px, 0);
          animation: popTriangle 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s forwards;
        }

        @keyframes popTriangle {
          to {
            opacity: 1;
            transform: scale(1) translate3d(0, 0, 0);
          }
        }

        /* 8. Letter-by-letter entrance classes */
        .wordmark-letter {
          display: inline-block;
          opacity: 0;
          transform: translate3d(15px, 0, 0);
          filter: blur(6px);
          animation: wordmarkLetterIntro 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes wordmarkLetterIntro {
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            filter: blur(0px);
          }
        }

        /* 9. Glow sweep across completed brand */
        .premium-branding-shine-sweep {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 35%,
            rgba(255, 255, 255, 0.15) 50%,
            transparent 65%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: performShineSweep 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes performShineSweep {
          0% {
            background-position: 15vw 0;
          }
          100% {
            background-position: -15vw 0;
          }
        }

        /* 10. Status text transition opacity */
        .status-text-transition {
          animation: statusTextPulse 1.8s ease-in-out infinite;
        }

        @keyframes statusTextPulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>

      {/* Depth Backgrounds */}
      <div className="ambient-backlight premium-gpu-stack" />
      <div className="absolute inset-0 fintech-grid-overlay opacity-50 pointer-events-none" />

      {/* Main Structural Align Box */}
      <div className="relative flex flex-col items-center select-none premium-gpu-stack">
        
        {/* Row matching logo structure: [Icon Wrapper] [Wordmark Space] */}
        <div className="flex items-center space-x-7">
          
          {/* Logo block with pristine fintech slate backing and borders */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center rounded-2xl bg-[#090F1E]/95 border border-slate-900/60 shadow-2xl relative overflow-hidden">
            <svg
              viewBox="0 0 100 100"
              className="w-20 h-20 sm:w-24 sm:h-24 premium-gpu-stack"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Svg Definitions for Masks and Glows */}
              <defs>
                <mask id="checkmark-drawing-mask">
                  <path
                    className="sketch-checkmark-mask"
                    d="M 44,63 L 57,78 L 88,41"
                    stroke="white"
                    strokeWidth="20"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </mask>
              </defs>

              {/* Step 1+: Outer stylized white A frame */}
              {step >= 1 && (
                <g className="premium-gpu-stack">
                  {/* Left segment */}
                  <path
                    className="build-left-a"
                    d="M 17 84 L 50 16 L 50 47 L 31 84 Z"
                    fill="#FFFFFF"
                  />
                  {/* Right segment */}
                  <path
                    className="build-right-a"
                    d="M 50 16 L 73 62 L 64 53 L 50 47 Z"
                    fill="#FFFFFF"
                  />
                </g>
              )}

              {/* Step 1+: Yellow gold triangle pop */}
              {step >= 1 && (
                <polygon
                  className="build-yellow-triangle premium-gpu-stack"
                  points="33,84 48,84 40,70"
                  fill="#F5B000"
                />
              )}

              {/* Step 0+: Green approval checkmark with draw mask */}
              <g mask="url(#checkmark-drawing-mask)" className="premium-gpu-stack">
                <path
                  d="M 48 70 L 57 82 L 85 45 L 79 40 L 57 69 L 48 59 Z"
                  fill="#10B981"
                />
              </g>

              {/* Glow core sparkle on checkmark start vertex */}
              {step === 0 && (
                <circle
                  className="checkmark-spark"
                  cx="48"
                  cy="64"
                  r="5"
                  fill="#10B981"
                />
              )}
            </svg>

            {/* Sweep Light Transition at Phase 3 */}
            {step >= 3 && <div className="premium-branding-shine-sweep pointer-events-none" />}
          </div>

          {/* Letter by letter text container */}
          {step >= 2 && (
            <div className="overflow-hidden py-3">
              <div className="flex items-center leading-none tracking-wider font-extrabold text-5xl sm:text-6xl select-none">
                {/* APRO word segment */}
                <div className="flex">
                  {aproLetters.map((char, index) => (
                    <span
                      key={`apro-${index}`}
                      className="wordmark-letter text-white font-black font-sans tracking-tight"
                      style={{
                        animationDelay: `${index * 0.09}s`,
                        willChange: "transform, opacity, filter",
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </div>

                {/* FLOW word segment */}
                <div className="flex ml-0.5">
                  {flowLetters.map((char, index) => (
                    <span
                      key={`flow-${index}`}
                      className="wordmark-letter text-[#F5B000] font-black font-sans tracking-tight"
                      style={{
                        animationDelay: `${0.35 + index * 0.09}s`,
                        willChange: "transform, opacity, filter",
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Dynamic Fintech-grade Status & Progress Indicator */}
        <div className="mt-16 flex flex-col items-center justify-center space-y-4">
          
          {/* Dynamic loading label */}
          <span className="status-text-transition text-[11px] uppercase tracking-[0.28em] text-slate-400 font-medium font-sans h-5 text-center px-4">
            {loadingText}
          </span>

          {/* Elegant SaaS micro timeline track */}
          <div className="w-24 h-0.5 bg-slate-900/90 rounded-full overflow-hidden relative border border-slate-950/20">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              style={{
                width: step === 0 ? "25%" : step === 1 ? "55%" : step === 2 ? "80%" : "100%",
                transition: "width 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </div>

        </div>

      </div>
    </div>
  );
};
