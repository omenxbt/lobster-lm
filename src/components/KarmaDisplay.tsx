"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useKarma } from "@/hooks/useKarma";

interface KarmaDisplayProps {
  earnedKarma?: number;
  showEarned?: boolean;
}

export function KarmaDisplay({ earnedKarma, showEarned }: KarmaDisplayProps) {
  const { karma } = useKarma();

  return (
    <div className="stat">
      <motion.span
        key={karma}
        initial={{ scale: 1 }}
        animate={earnedKarma && showEarned ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
        className="stat-number block"
        style={{ fontFamily: "var(--font-cinzel)", fontSize: "2.5rem", color: "var(--text-primary)" }}
      >
        {karma}
      </motion.span>
      <span className="stat-label block mt-1" style={{ fontSize: "0.7rem", letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase" }}>
        Karma
      </span>
      <AnimatePresence>
        {earnedKarma && showEarned && (
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="block mt-1 text-sm"
            style={{ color: "var(--accent-gold)" }}
          >
            +{earnedKarma}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
