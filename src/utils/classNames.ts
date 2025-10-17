// src/utils/classNames.ts
export const classNames = (
  ...classes: (string | boolean | undefined | null)[]
) => {
  return classes.filter(Boolean).join(' ')
}

// Example usage:
// className={classNames(
//   styles.card,
//   isActive && styles.active,
//   isDisabled && styles.disabled
// )}
