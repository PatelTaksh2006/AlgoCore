import { useCallback, useEffect, useRef, useState } from 'react';

export function useSimulationController({
  createGenerator,
  applyStep,
  resetVisualState,
  speed,
  initialState,
}) {
  const [isPlaying, setIsPlaying] = useState(initialState?.isPlaying ?? false);
  const [currentStep, setCurrentStep] = useState(initialState?.currentStep ?? 0);
  const [history, setHistory] = useState(initialState?.history ?? []);
  const [isCompleted, setIsCompleted] = useState(initialState?.isCompleted ?? false);
  const [hasStartedRun, setHasStartedRun] = useState(
    initialState?.hasStartedRun ?? ((initialState?.currentStep ?? 0) > 0 && !(initialState?.isCompleted ?? false))
  );

  const generatorRef = useRef(null);
  const timerRef = useRef(null);

  const resetAlgorithm = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    setHistory([]);
    setIsCompleted(false);
    setHasStartedRun(false);
    resetVisualState();
    generatorRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [resetVisualState]);

  const runAlgorithm = useCallback(() => {
    resetAlgorithm();
    const nextGenerator = createGenerator();
    if (!nextGenerator) {
      return false;
    }

    generatorRef.current = nextGenerator;
    setIsCompleted(false);
    setHasStartedRun(true);
    return true;
  }, [createGenerator, resetAlgorithm]);

  const resumeAlgorithm = useCallback(() => {
    if (isCompleted) {
      return false;
    }

    if (!generatorRef.current) {
      const resumedGenerator = createGenerator();
      if (!resumedGenerator) {
        return false;
      }

      let completedEarly = false;

      for (let stepIdx = 0; stepIdx < currentStep; stepIdx += 1) {
        while (true) {
          const { value, done } = resumedGenerator.next();
          if (done) {
            completedEarly = true;
            break;
          }
          if (value?.type === 'SET_LINE') {
            break;
          }
        }

        if (completedEarly) {
          break;
        }
      }

      generatorRef.current = resumedGenerator;

      if (completedEarly) {
        setIsCompleted(true);
        setHasStartedRun(false);
        setIsPlaying(false);
        return false;
      }
    }

    setHasStartedRun(true);
    setIsPlaying(true);
    return true;
  }, [isCompleted, createGenerator, currentStep]);

  const nextStep = useCallback(() => {
    if (!generatorRef.current) {
      return;
    }

    const batch = [];
    let done = false;

    while (true) {
      const { value, done: isDone } = generatorRef.current.next();
      if (isDone) {
        done = true;
        break;
      }

      if (value) {
        batch.push(value);
        applyStep(value);
        if (value.type === 'SET_LINE') {
          break;
        }
      }
    }

    if (batch.length > 0) {
      setHistory((prev) => [...prev, batch]);
      setCurrentStep((prev) => prev + 1);
      setIsCompleted(false);
    }

    if (done) {
      setIsPlaying(false);
      setIsCompleted(true);
      setHasStartedRun(false);
    }
  }, [applyStep]);

  const prevStep = useCallback(() => {
    if (currentStep <= 0) {
      return;
    }

    setIsPlaying(false);
    setIsCompleted(false);

    const newStepCount = currentStep - 1;
    resetVisualState();

    const flattenedEvents = history.slice(0, newStepCount).flat();
    flattenedEvents.forEach((step) => applyStep(step));

    setCurrentStep(newStepCount);
    setHasStartedRun(newStepCount > 0);
  }, [currentStep, history, resetVisualState, applyStep]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        nextStep();
      }, speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, speed, nextStep]);

  return {
    isPlaying,
    setIsPlaying,
    currentStep,
    history,
    isCompleted,
    hasStartedRun,
    runAlgorithm,
    resumeAlgorithm,
    nextStep,
    prevStep,
    resetAlgorithm,
  };
}
