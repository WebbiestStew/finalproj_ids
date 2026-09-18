import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { AuthContext, TOKEN_STORAGE_KEY } from './auth-context';

// The JWT lives in localStorage: simple and stateless for an SPA, but readable by
// any script that runs on the page — which is why the API also rejects markup in
// user-supplied text (see the XSS finding in the closing report).
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
  const freshTokenRef = useRef(null);

  useEffect(() => {
    // A token we just received from login/register already came with its user.
    if (!token || freshTokenRef.current === token) return undefined;

    let cancelled = false;
    api
      .me(token)
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch((err) => {
        if (cancelled) return;
        // Only drop the session when the server says it's invalid — a flaky
        // connection shouldn't log anyone out.
        if (err.status === 401 || err.status === 404) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const startSession = useCallback((data) => {
    freshTokenRef.current = data.token;
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  const login = useCallback(async (credentials) => startSession(await api.login(credentials)), [startSession]);
  const register = useCallback(async (payload) => startSession(await api.register(payload)), [startSession]);

  const logout = useCallback(() => {
    freshTokenRef.current = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
