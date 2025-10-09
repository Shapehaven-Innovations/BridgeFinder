import React from 'react'
import styles from './Spinner.module.css'

export type SpinnerSize = 'sm' | 'md' | 'lg'
export type SpinnerColor = 'primary' | 'secondary' | 'white'

export interface SpinnerProps {
  size?: SpinnerSize
  color?: SpinnerColor
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const spinnerClasses = [styles.spinner, styles[size], className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={spinnerClasses} role="status" aria-label="Loading">
      <svg className={styles.svg} viewBox="0 0 50 50">
        <circle
          className={`${styles.circle} ${styles[color]}`}
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
    </div>
  )
}
