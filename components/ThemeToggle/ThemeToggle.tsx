// components/ThemeToggle/ThemeToggle.tsx
import { useTheme } from '../../src/lib/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label="Toggle dark mode"
      type="button"
    >
      <span className="theme-icon theme-icon-light" aria-hidden="true">
        ☀️
      </span>
      <span className="theme-icon theme-icon-dark" aria-hidden="true">
        🌙
      </span>
    </button>
  )
}
