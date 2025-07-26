'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';


export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is already enabled
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  useEffect(() => {
    // Initialize dark mode from localStorage on component mount
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else if (savedDarkMode === 'false') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      // Default to system preference
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark');
        setIsDark(true);
      }
    }
  }, []);

  return (
    <button
      onClick={toggleDarkMode}
      className='p-2 rounded-lg border border-admin-light-border dark:border-admin-border bg-admin-light-bg-surface dark:bg-admin-bg-surface text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent dark:hover:text-admin-accent hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover hover:shadow-admin-glow transition-all duration-200'
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
    </button>
  );
}
