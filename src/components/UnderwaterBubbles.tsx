"use client";

import { useEffect, useState } from "react";

interface Bubble {
  id: number;
  char: string;
  left: number; // percentage
  delay: number; // seconds
  duration: number; // seconds
  size: number; // font size multiplier
  drift: number; // horizontal drift in pixels
}

const BUBBLE_CHARS = ['o', 'O', '°', '·'];
const NUM_BUBBLES = 3;

export function UnderwaterBubbles() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    // Generate random bubbles positioned only on the sides (avoiding center lobster area)
    // Lobster is roughly centered, so we'll place bubbles in left 0-35% and right 65-100%
    const newBubbles: Bubble[] = Array.from({ length: NUM_BUBBLES }, (_, i) => {
      // Randomly choose left or right side
      const isLeftSide = Math.random() < 0.5;
      const left = isLeftSide 
        ? Math.random() * 35 // Left side: 0-35%
        : 65 + Math.random() * 35; // Right side: 65-100%
      
      return {
        id: i,
        char: BUBBLE_CHARS[Math.floor(Math.random() * BUBBLE_CHARS.length)],
        left: left,
        delay: i * 5 + Math.random() * 4, // Staggered: 0s, 5s + random 0-4s (much less frequent)
        duration: 12 + Math.random() * 8, // 12-20 seconds (50% slower - doubled from 6-10)
        size: 0.6 + Math.random() * 0.3, // 0.6-0.9 multiplier
        drift: (Math.random() - 0.5) * 15, // -7.5px to 7.5px horizontal drift
      };
    });
    setBubbles(newBubbles);
  }, []);

  return (
    <div className="underwater-bubbles-container">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            left: `${bubble.left}%`,
            animationDelay: `${bubble.delay}s`,
            animationDuration: `${bubble.duration}s`,
            fontSize: `${bubble.size}em`,
            opacity: 1, // Always 100% opacity
            '--bubble-drift': bubble.drift,
          } as React.CSSProperties}
        >
          {bubble.char}
        </div>
      ))}
    </div>
  );
}
