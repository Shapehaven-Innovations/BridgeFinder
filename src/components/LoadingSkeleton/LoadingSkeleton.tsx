// components/LoadingSkeleton/LoadingSkeleton.tsx
import React from 'react'
import styles from './LoadingSkeleton.module.css'

export const CardSkeleton: React.FC = () => {
  return (
    <div className={styles.card}>
      <div className={styles.shimmer} />
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.title}`} />
          <div className={`${styles.skeleton} ${styles.badge}`} />
        </div>
        <div className={styles.section}>
          <div className={`${styles.skeleton} ${styles.label}`} />
          <div className={`${styles.skeleton} ${styles.value}`} />
        </div>
        <div className={styles.section}>
          <div className={`${styles.skeleton} ${styles.text}`} />
          <div className={`${styles.skeleton} ${styles.text}`} />
        </div>
        <div className={`${styles.skeleton} ${styles.button}`} />
      </div>
    </div>
  )
}

export const CardSkeletonGrid: React.FC<{ count?: number }> = ({
  count = 3,
}) => {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export const FormSkeleton: React.FC = () => {
  return (
    <div className={styles.formContainer}>
      <div className={styles.shimmer} />
      <div className={styles.formContent}>
        <div className={`${styles.skeleton} ${styles.formTitle}`} />
        <div className={styles.formRow}>
          <div className={`${styles.skeleton} ${styles.input}`} />
          <div className={`${styles.skeleton} ${styles.input}`} />
        </div>
        <div className={styles.formRow}>
          <div className={`${styles.skeleton} ${styles.input}`} />
          <div className={`${styles.skeleton} ${styles.input}`} />
        </div>
        <div className={`${styles.skeleton} ${styles.button}`} />
      </div>
    </div>
  )
}
