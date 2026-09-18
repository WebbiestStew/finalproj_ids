import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import CarArt from '../components/CarArt';
import FormAlert from '../components/FormAlert';
import PageLoader from '../components/PageLoader';
import { BODIES, COLORS, FUELS, TRANSMISSIONS } from '../utils/vehicleOptions';
import { validateVehicle } from '../utils/validateVehicle';
import './VehicleForm.css';

const EMPTY = {
  brand: '',
  model: '',
  year: String(new Date().getFullYear()),
  price: '',
  mileage: '',
  color: 'Blanco',
  transmission: 'Automática',
  fuel: 'Gasolina',
  body: 'Sedán',
  description: '',
};

const toValues = (vehicle) => ({
  ...vehicle,
  year: String(vehicle.year),
  price: String(vehicle.price),
  mileage: String(vehicle.mileage),
});

function Select({ id, label, value, options, onChange, error }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={onChange} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-error` : undefined}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

function TextField({ id, label, error, ...input }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-error` : undefined} {...input} />
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

function Fields({ initial, vehicleId }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const found = validateVehicle(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const body = {
      brand: values.brand.trim(),
      model: values.model.trim(),
      year: Number(values.year),
      price: Number(values.price),
      mileage: Number(values.mileage),
      color: values.color,
      transmission: values.transmission,
      fuel: values.fuel,
      body: values.body,
      description: values.description.trim(),
    };

    setSubmitting(true);
    try {
      if (vehicleId) await api.updateVehicle(token, vehicleId, body);
      else await api.createVehicle(token, body);
      navigate('/inventario', { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vehicle-form-layout">
      <div className="vehicle-form-preview" aria-hidden="true">
        <CarArt body={values.body} color={values.color} />
        <p>Así se verá tu auto en el catálogo</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="vehicle-form">
        <FormAlert message={formError} />

        <div className="form-row">
          <TextField id="brand" label="Marca" value={values.brand} onChange={set('brand')} error={errors.brand} placeholder="Toyota" autoComplete="off" />
          <TextField id="model" label="Modelo" value={values.model} onChange={set('model')} error={errors.model} placeholder="Corolla" autoComplete="off" />
        </div>

        <div className="form-row">
          <TextField id="year" label="Año" type="number" inputMode="numeric" value={values.year} onChange={set('year')} error={errors.year} />
          <TextField id="mileage" label="Kilometraje" type="number" inputMode="numeric" min="0" value={values.mileage} onChange={set('mileage')} error={errors.mileage} placeholder="42000" />
        </div>

        <TextField id="price" label="Precio (MXN)" type="number" inputMode="numeric" min="1" value={values.price} onChange={set('price')} error={errors.price} placeholder="329900" />

        <div className="form-row">
          <Select id="body" label="Carrocería" value={values.body} options={BODIES} onChange={set('body')} error={errors.body} />
          <Select id="color" label="Color" value={values.color} options={Object.keys(COLORS)} onChange={set('color')} error={errors.color} />
        </div>

        <div className="form-row">
          <Select id="transmission" label="Transmisión" value={values.transmission} options={TRANSMISSIONS} onChange={set('transmission')} error={errors.transmission} />
          <Select id="fuel" label="Combustible" value={values.fuel} options={FUELS} onChange={set('fuel')} error={errors.fuel} />
        </div>

        <div className="field">
          <label htmlFor="description">Descripción (opcional)</label>
          <textarea
            id="description"
            value={values.description}
            onChange={set('description')}
            maxLength={1000}
            placeholder="Historial de servicios, equipamiento, detalles importantes…"
            aria-invalid={errors.description ? 'true' : undefined}
            aria-describedby={errors.description ? 'description-error' : undefined}
          />
          {errors.description && (
            <span className="field-error" id="description-error">
              {errors.description}
            </span>
          )}
        </div>

        <div className="form-actions">
          <Link to="/inventario" className="btn btn-quiet">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting && <span className="spinner" aria-hidden="true" />}
            {vehicleId ? 'Guardar cambios' : 'Publicar vehículo'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VehicleForm() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const editing = Boolean(id);
  usePageTitle(editing ? 'Editar vehículo' : 'Publicar vehículo');
  const [loaded, setLoaded] = useState({ id: null, vehicle: null, error: '' });

  useEffect(() => {
    if (!editing) return undefined;
    let cancelled = false;
    api
      .getVehicle(id)
      .then((data) => {
        if (!cancelled) setLoaded({ id, vehicle: data.vehicle, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setLoaded({ id, vehicle: null, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [editing, id, token]);

  let content;
  if (!editing) {
    content = <Fields initial={EMPTY} />;
  } else if (loaded.id !== id) {
    content = <PageLoader />;
  } else if (!loaded.vehicle) {
    content = <p className="alert alert-error">{loaded.error || 'No se encontró el vehículo.'}</p>;
  } else if (loaded.vehicle.dealer_id !== user.id) {
    return <Navigate to="/inventario" replace />;
  } else {
    content = <Fields key={loaded.vehicle.id} initial={toValues(loaded.vehicle)} vehicleId={id} />;
  }

  return (
    <div className="container form-page">
      <Link to="/inventario" className="back-link">
        <span className="back-chevron">‹</span> Mi inventario
      </Link>
      <h1>{editing ? 'Editar vehículo' : 'Publicar vehículo'}</h1>
      {content}
    </div>
  );
}
