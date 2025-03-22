// src/hooks/useQuizTimer.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseQuizTimerProps {
  defaultTime: number;
  onTimeUp: () => void;
  isActive: boolean;
}

export const useQuizTimer = ({
  defaultTime,
  onTimeUp,
  isActive,
}: UseQuizTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(defaultTime);
  const [isPaused, setIsPaused] = useState(false);
  const [timeSpentOnQuestion, setTimeSpentOnQuestion] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  const resetTimer = useCallback((newTime?: number) => {
    setTimeLeft(newTime || defaultTime);
    startTimeRef.current = Date.now();
    setTimeSpentOnQuestion(0);
    setIsPaused(false);
  }, [defaultTime]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Timer for countdown
  useEffect(() => {
    if (isPaused || !isActive || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = Math.max(0, prev - 1);
        if (newTime === 0) {
          onTimeUp();
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isPaused, isActive, timeLeft, onTimeUp]);
  
  // Timer for time spent
  useEffect(() => {
    if (isPaused || !isActive) return;
    
    const timer = setInterval(() => {
      setTimeSpentOnQuestion(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isPaused, isActive]);

  return {
    timeLeft,
    isPaused,
    timeSpentOnQuestion,
    resetTimer,
    startTimer,
    togglePause,
  };
};