"use client";

import { useState, useEffect, useCallback } from "react";

const KARMA_STORAGE_KEY = "lobster-karma";

export function useKarma() {
  const [karma, setKarma] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize karma from localStorage or generate random starting value
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(KARMA_STORAGE_KEY);
      if (stored) {
        setKarma(parseInt(stored, 10));
      } else {
        // Generate random starting karma between 100-500
        const initialKarma = Math.floor(Math.random() * 401) + 100;
        setKarma(initialKarma);
        localStorage.setItem(KARMA_STORAGE_KEY, initialKarma.toString());
      }
      setIsInitialized(true);
    }
  }, []);

  const addKarma = useCallback((amount: number) => {
    setKarma((prev) => {
      const newKarma = prev + amount;
      if (typeof window !== "undefined") {
        localStorage.setItem(KARMA_STORAGE_KEY, newKarma.toString());
      }
      return newKarma;
    });
  }, []);

  const resetKarma = useCallback(() => {
    const initialKarma = Math.floor(Math.random() * 401) + 100;
    setKarma(initialKarma);
    if (typeof window !== "undefined") {
      localStorage.setItem(KARMA_STORAGE_KEY, initialKarma.toString());
    }
  }, []);

  return {
    karma,
    addKarma,
    resetKarma,
    isInitialized,
  };
}
