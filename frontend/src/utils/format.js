const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('es-MX');

export const formatPrice = (value) => money.format(value);
export const formatKm = (value) => `${number.format(value)} km`;
