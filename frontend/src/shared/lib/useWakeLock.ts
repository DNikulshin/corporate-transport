import { useState, useEffect, useCallback, useRef } from 'react';

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if ('wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const request = useCallback(async () => {
    if (!isSupported) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      console.log('Wake Lock is active');
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake Lock has been released');
    }
  }, []);

  useEffect(() => {
    // Освобождаем блокировку при размонтировании компонента
    return () => {
      release();
    };
  }, [release]);

  return { isSupported, request, release };
}
