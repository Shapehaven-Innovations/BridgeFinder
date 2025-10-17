// components/Badge/Badge.tsx
import React from 'react'
import styles from './Badge.module.css'

type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'purple'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: React.ReactNode
  pill?: boolean
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  pill = false,
  className = '',
}) => {
  const badgeClasses = [
    styles.badge,
    styles[variant],
    styles[size],
    pill && styles.pill,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={badgeClasses}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{children}</span>
    </span>
  )
}
