"use client";

import React, { useState } from "react";
import Image from "next/image";

export interface ImageFallbackProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  fallbackCategory?: string;
}

export const ImageFallback: React.FC<ImageFallbackProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = "",
  fallbackCategory = "Produce",
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-ivory-100 border border-ivory-200 text-forest-700/60 p-4 select-none ${className}`}
        style={fill ? { width: "100%", height: "100%" } : { width: width || "100%", height: height || 200 }}
        role="img"
        aria-label={`${alt} (placeholder)`}
      >
        <svg
          className="w-10 h-10 mb-2 opacity-60 text-forest-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-xs font-medium tracking-wide uppercase">{fallbackCategory}</span>
        <span className="text-[11px] text-forest-500/70 mt-0.5 truncate max-w-[90%] text-center">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-ivory-200/70 animate-pulse z-10" />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width || 600}
        height={fill ? undefined : height || 400}
        fill={fill}
        priority={priority}
        className={`object-cover transition-opacity duration-300 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
};
