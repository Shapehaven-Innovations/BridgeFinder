// components/Spinner/Spinner.tsx
import React from 'react'
import styles from './Spinner.module.css'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`${styles.spinner} ${styles[size]} ${className}`}>
      <svg className={styles.svg} viewBox="0 0 50 50">
        <circle
          className={styles.circle}
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
