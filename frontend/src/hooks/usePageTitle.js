import { useEffect } from 'react';

const BASE = 'DAuto — Compra y venta de vehículos';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — DAuto` : BASE;
  }, [title]);
}
