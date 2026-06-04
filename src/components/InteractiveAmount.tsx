import React, { useState } from "react";

interface InteractiveAmountProps {
  amount: number;
  className?: string;
  showCurrency?: boolean;
}

export function formatIndianLargeNumber(val: number): { text: string; isBig: boolean } {
  if (val >= 10000000) { // 1 Crore (10,000,000)
    return {
      text: `${(val / 10000000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`,
      isBig: true,
    };
  } else if (val >= 100000) { // 1 Lakh (100,000)
    return {
      text: `${(val / 100000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Lakhs`,
      isBig: true,
    };
  } else if (val >= 1000) { // Thousands (1,000)
    return {
      text: `${(val / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}k`,
      isBig: false,
    };
  }
  return {
    text: val.toLocaleString("en-IN"),
    isBig: false,
  };
}

export function InteractiveAmount({ amount, className = "", showCurrency = true }: InteractiveAmountProps) {
  const [showExact, setShowExact] = useState(false);

  const parsed = Number(amount) || 0;
  const currencySymbol = showCurrency ? "₹" : "";

  // Trigger compression if ≥ 100,000 (1 Lakh)
  const isTooBig = parsed >= 100000;

  let formattedText = "";
  if (isTooBig && !showExact) {
    const abbreviated = formatIndianLargeNumber(parsed);
    formattedText = `${currencySymbol}${abbreviated.text}`;
  } else {
    // Auto-detect decimals
    const hasDecimals = parsed % 1 !== 0;
    formattedText = `${currencySymbol}${parsed.toLocaleString("en-IN", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <span
      onClick={(e) => {
        if (isTooBig) {
          e.stopPropagation();
          setShowExact(!showExact);
        }
      }}
      className={`cursor-pointer select-none transition-colors border-b border-dashed border-gray-300 hover:border-emerald-600 hover:text-emerald-800 ${className}`}
      title={isTooBig ? (showExact ? "Click to compress to Lakhs/Crores" : "Click to view exact rupee amount") : undefined}
    >
      {formattedText}
    </span>
  );
}
