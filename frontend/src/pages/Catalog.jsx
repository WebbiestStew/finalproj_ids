import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { usePageTitle } from '../hooks/usePageTitle';
import Icon from '../components/Icon';
import VehicleCard, { VehicleCardSkeleton } from '../components/VehicleCard';
import { BODIES, MIN_YEARS, PRICE_CAPS, SORT_OPTIONS } from '../utils/vehicleOptions';
import { formatPrice } from '../utils/format';
import './Catalog.css';

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 250;

// URL parameter (Spanish, readable when shared) → API parameter
const URL_TO_API = { q: 'q', marca: 'brand', carroceria: 'body', precio: 'maxPrice', anio: 'minYear', orden: 'sort' };

export default function Catalog() {
  usePageTitle('Catálogo');
  const [params, setParams] = useSearchParams();
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState(params.get('q') || '');
  const [result, setResult] = useState({ key: null, status: 'loading', items: [], total: 0, error: '' });
  const [more, setMore] = useState({ loading: false, error: '' });

  const apiParams = useMemo(() => {
    const out = {};
    Object.entries(URL_TO_API).forEach(([urlKey, apiKey]) => {
      const value = params.get(urlKey);
      if (value) out[apiKey] = value;
    });
    return out;
  }, [params]);
  const key = JSON.stringify(apiParams);
  const loading = result.key !== key;

  const setParam = (name, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(name, value);
        else next.delete(name);
        return next;
      },
      { replace: true }
    );

  useEffect(() => {
    let cancelled = false;
    api
      .vehicleBrands()
      .then((data) => {
        if (!cancelled) setBrands(data.brands);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .listVehicles({ ...JSON.parse(key), limit: PAGE_SIZE })
      .then((data) => {
        if (!cancelled) setResult({ key, status: 'ready', items: data.vehicles, total: data.total, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setResult({ key, status: 'error', items: [], total: 0, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Typing updates the box instantly; the URL (and the request) follow shortly after.
  const urlQuery = params.get('q') || '';
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === urlQuery) return undefined;

    const timer = setTimeout(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (trimmed) next.set('q', trimmed);
          else next.delete('q');
          return next;
        },
        { replace: true }
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, urlQuery, setParams]);

  const loadMore = async () => {
    setMore({ loading: true, error: '' });
    try {
      const data = await api.listVehicles({ ...apiParams, limit: PAGE_SIZE, offset: result.items.length });
      setResult((prev) => (prev.key === key ? { ...prev, items: [...prev.items, ...data.vehicles] } : prev));
      setMore({ loading: false, error: '' });
    } catch (err) {
      setMore({ loading: false, error: err.message });
    }
  };

  const hasFilters = ['q', 'marca', 'carroceria', 'precio', 'anio'].some((name) => params.get(name));
  const clearFilters = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  const count = result.total === 1 ? '1 auto' : `${result.total} autos`;

  return (
    <div className="container catalog">
      <header className="catalog-head">
        <h1>Catálogo</h1>
        <p>Autos publicados directamente por concesionarias, con el precio a la vista.</p>
      </header>

      <form className="filters" role="search" aria-label="Filtrar autos" onSubmit={(e) => e.preventDefault()}>
        <div className="field filter-search">
          <label htmlFor="q">Buscar</label>
          <div className="search-box">
            <Icon name="search" size={18} />
            <input
              id="q"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Marca o modelo, por ejemplo Corolla"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="marca">Marca</label>
          <select id="marca" value={params.get('marca') || ''} onChange={(e) => setParam('marca', e.target.value)}>
            <option value="">Todas</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="carroceria">Carrocería</label>
          <select id="carroceria" value={params.get('carroceria') || ''} onChange={(e) => setParam('carroceria', e.target.value)}>
            <option value="">Todas</option>
            {BODIES.map((body) => (
              <option key={body} value={body}>
                {body}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="precio">Precio máximo</label>
          <select id="precio" value={params.get('precio') || ''} onChange={(e) => setParam('precio', e.target.value)}>
            <option value="">Sin límite</option>
            {PRICE_CAPS.map((cap) => (
              <option key={cap} value={cap}>
                Hasta {formatPrice(cap)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="anio">Año</label>
          <select id="anio" value={params.get('anio') || ''} onChange={(e) => setParam('anio', e.target.value)}>
            <option value="">Cualquiera</option>
            {MIN_YEARS.map((year) => (
              <option key={year} value={year}>
                {year} en adelante
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="orden">Ordenar por</label>
          <select id="orden" value={params.get('orden') || 'recientes'} onChange={(e) => setParam('orden', e.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </form>

      <div className="catalog-status" aria-live="polite">
        {!loading && result.status === 'ready' && <span>{result.total === 0 ? 'Ningún auto coincide' : count}</span>}
        {hasFilters && (
          <button type="button" className="btn btn-quiet btn-sm" onClick={clearFilters}>
            Limpiar filtros
          </button>
        )}
      </div>

      {!loading && result.status === 'error' && (
        <p className="alert alert-error" role="alert">
          <Icon name="alert" size={18} />
          <span>{result.error}</span>
        </p>
      )}

      {loading && (
        <div className="vehicle-grid" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && result.status === 'ready' && result.total === 0 && (
        <div className="empty catalog-empty">
          <Icon name="car" size={36} className="empty-icon" />
          <h2>No encontramos autos con esos filtros</h2>
          <p>Prueba con otra marca o quita algún filtro.</p>
          {hasFilters && (
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {!loading && result.items.length > 0 && (
        <>
          <div className="vehicle-grid">
            {result.items.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>

          {result.items.length < result.total && (
            <div className="load-more">
              {more.error && (
                <p className="alert alert-error" role="alert">
                  <Icon name="alert" size={18} />
                  <span>{more.error}</span>
                </p>
              )}
              <button type="button" className="btn btn-secondary" onClick={loadMore} disabled={more.loading}>
                {more.loading ? 'Cargando…' : `Ver más (${result.total - result.items.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
