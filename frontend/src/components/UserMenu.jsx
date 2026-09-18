import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';
import './UserMenu.css';

function initialsOf(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// Critically damped (no overshoot) — a menu appearing isn't a momentum
// gesture, so it settles smoothly rather than bouncing. Anchored to the
// trigger (top-right) rather than the dropdown's own center, so it reads as
// growing out of the avatar that opened it.
const MATERIALIZE = {
  initial: { opacity: 0, scale: 0.92, y: -6, filter: 'blur(6px)' },
  animate: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.95, y: -4, filter: 'blur(4px)' },
};

const REDUCED_MOTION_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  const variants = prefersReducedMotion ? REDUCED_MOTION_VARIANTS : MATERIALIZE;

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="user-avatar">{initialsOf(user.name)}</span>
        <span className="user-menu-name">{user.name.split(' ')[0]}</span>
        <svg
          className={`user-menu-chevron ${open ? 'is-open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="user-menu-dropdown"
            role="menu"
            style={{ transformOrigin: 'top right' }}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={
              prefersReducedMotion
                ? { duration: 0.15 }
                : { type: 'spring', bounce: 0, duration: 0.35 }
            }
          >
            <div className="user-menu-header">
              <span className="user-avatar user-avatar-lg">{initialsOf(user.name)}</span>
              <div>
                <p className="user-menu-fullname">{user.name}</p>
                <p className="user-menu-email">{user.email}</p>
              </div>
            </div>
            <div className="user-menu-role">
              <RoleBadge role={user.role} />
            </div>
            <div className="user-menu-divider" />
            <Link to="/panel" className="user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              Mi panel
            </Link>
            <button type="button" className="user-menu-item user-menu-item-danger" role="menuitem" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Cerrar sesion
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
