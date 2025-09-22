'use client';

import { useState, useEffect, useCallback } from 'react';

// Custom hook to handle dynamic keys in localStorage
export function useLocalStorage<T>(key: string | null, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined' || key === null) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // This effect will re-read the value from localStorage when the key changes.
  useEffect(() => {
    setStoredValue(readValue());
  }, [key, readValue]);
  
  const setValue = (value: T | ((val: T) => T)) => {
    if (key === null) {
      console.warn('Cannot set localStorage value, key is null.');
      return;
    }
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };


  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key && e.newValue) {
            try {
                setStoredValue(JSON.parse(e.newValue));
            } catch (error) {
                console.warn(`Error parsing new value for key “${key}”:`, error);
            }
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}
