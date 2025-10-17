// components/ThemeToggle/ThemeToggle.tsx
import React, { useState, useEffect } from 'react'
import styles from './ThemeToggle.module.css'

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')

    setTheme(initialTheme)
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <button
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className={styles.iconContainer}>
        <span
          className={`${styles.icon} ${styles.sun} ${theme === 'light' ? styles.active : ''}`}
        >
          ☀️
        </span>
        <span
          className={`${styles.icon} ${styles.moon} ${theme === 'dark' ? styles.active : ''}`}
        >
          🌙
        </span>
      </div>
    </button>
  )
}
