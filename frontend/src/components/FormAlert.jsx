import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export default function FormAlert({ message }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="alert alert-error"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, marginBottom: 0 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto', marginBottom: 18 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, marginBottom: 0 }}
          transition={prefersReducedMotion ? { duration: 0.12 } : { type: 'spring', bounce: 0, duration: 0.3 }}
          style={{ marginBottom: 0, overflow: 'hidden' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginRight: 6 }}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
