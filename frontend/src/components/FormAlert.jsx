import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Icon from './Icon';

// role="alert" makes screen readers announce the message the moment it appears.
export default function FormAlert({ message }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="alert alert-error"
          role="alert"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, marginBottom: 0 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto', marginBottom: 18 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, marginBottom: 0 }}
          transition={prefersReducedMotion ? { duration: 0.12 } : { type: 'spring', bounce: 0, duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          <Icon name="alert" size={18} />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
