// Mirrors backend/src/utils/vehicleOptions.js; the hex values only tint the illustration.
export const COLORS = {
  Blanco: '#f2f2f4',
  Negro: '#2a2a2d',
  Gris: '#8e8e93',
  Plata: '#c7c7cc',
  Rojo: '#c8202f',
  Azul: '#1f5fbf',
  Verde: '#2f7d4f',
  Naranja: '#e8761c',
  Amarillo: '#f2c230',
  Café: '#7a4b2a',
};

export const TRANSMISSIONS = ['Manual', 'Automática'];
export const FUELS = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico'];
export const BODIES = ['Sedán', 'Hatchback', 'SUV'];

export const STATUS_LABELS = { disponible: 'Disponible', apartado: 'Apartado', vendido: 'Vendido' };

export const SORT_OPTIONS = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio_asc', label: 'Precio: de menor a mayor' },
  { value: 'precio_desc', label: 'Precio: de mayor a menor' },
  { value: 'anio_desc', label: 'Año: más nuevos primero' },
  { value: 'km_asc', label: 'Menor kilometraje' },
];

export const PRICE_CAPS = [200000, 300000, 400000, 600000, 800000];
export const MIN_YEARS = [2015, 2018, 2020, 2022];
