"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BEHAVIORS,
  selectNextBehavior,
  getRandomDuration,
  getRandomStatusLine,
  type Behavior,
} from "@/lib/constants";

type AppState = "idle" | "typing" | "thinking" | "streaming" | "celebrating";

interface AsciiLobsterProps {
  state: AppState;
  earnedKarma?: number;
  onStatusChange?: (status: string) => void;
}

export function AsciiLobster({
  state,
  earnedKarma,
  onStatusChange,
}: AsciiLobsterProps) {
  const [currentBehavior, setCurrentBehavior] = useState<string>("IDLE");
  const [frameIndex, setFrameIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Get current behavior object
  const behavior = BEHAVIORS.find((b) => b.name === currentBehavior) || BEHAVIORS[0];

  // Frame animation loop
  useEffect(() => {
    if (behavior.frames.length <= 1) return;

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % behavior.frames.length);
    }, behavior.frameRate);

    return () => clearInterval(interval);
  }, [currentBehavior, behavior.frames.length, behavior.frameRate]);

  // Behavior transition loop (only when idle)
  useEffect(() => {
    if (state !== "idle") return; // Don't auto-transition during interaction

    const duration = getRandomDuration(behavior);
    const timeout = setTimeout(() => {
      const next = selectNextBehavior(currentBehavior, state);
      if (next !== currentBehavior) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentBehavior(next);
          setFrameIndex(0);
          setIsTransitioning(false);
        }, 100);
      }
    }, duration);

    return () => clearTimeout(timeout);
  }, [currentBehavior, state, behavior]);

  // React to app state changes
  useEffect(() => {
    switch (state) {
      case "typing":
        setCurrentBehavior("LOOK_UP");
        setFrameIndex(0);
        break;
      case "thinking":
        setCurrentBehavior("THINK");
        setFrameIndex(0);
        break;
      case "streaming":
        setCurrentBehavior("EXCITED");
        setFrameIndex(0);
        break;
      case "celebrating":
        if (earnedKarma) {
          setCurrentBehavior("BUBBLE");
          setFrameIndex(0);
          // After celebration, return to excited
          setTimeout(() => {
            setCurrentBehavior("EXCITED");
          }, 2000);
        }
        break;
      case "idle":
        // Return to natural behavior cycle
        if (currentBehavior === "STARTLE" || currentBehavior === "EXCITED") {
          setTimeout(() => {
            setCurrentBehavior("IDLE");
            setFrameIndex(0);
          }, 1000);
        }
        break;
    }
  }, [state, earnedKarma]);

  // Trigger STARTLE when user starts typing
  useEffect(() => {
    if (state === "typing" && currentBehavior !== "LOOK_UP") {
      setCurrentBehavior("STARTLE");
      setFrameIndex(0);
      setTimeout(() => {
        setCurrentBehavior("LOOK_UP");
        setFrameIndex(0);
      }, 500);
    }
  }, [state]);

  // Update status line
  useEffect(() => {
    if (onStatusChange) {
      const statusLine = getRandomStatusLine(behavior);
      onStatusChange(`🦞 ${statusLine}`);
    }
  }, [currentBehavior, behavior, onStatusChange]);

  const currentFrame = behavior.frames[frameIndex] || behavior.frames[0];

  return (
    <div className="relative flex flex-col items-center" style={{ position: 'relative', zIndex: 2 }}>
      <pre className="lobster-ascii">
        {currentFrame}
      </pre>
      
      {/* Optional: Karma particles effect */}
      {currentBehavior === "LOOK_UP" && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-xs"
              initial={{ opacity: 0, y: -20 }}
              animate={{
                opacity: [0, 1, 0],
                y: [0, -40],
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              style={{
                left: `${-10 + i * 10}px`,
                color: "var(--accent-gold)",
              }}
            >
              ·
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
