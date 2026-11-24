import { useEffect } from 'react';
import { ensureSession } from '../services/auth/session';
export function useAuthCheck() {
  useEffect(() => {
    const check = () => { if (!['/login', '/register'].includes(window.location.pathname)) ensureSession().catch(() => {}); };
    check();
    const interval = setInterval(check, 30000);
    const visible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', visible); };
  }, []);
}
export default useAuthCheck;
