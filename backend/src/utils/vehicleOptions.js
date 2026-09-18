const COLORS = ['Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul', 'Verde', 'Naranja', 'Amarillo', 'Café'];
const TRANSMISSIONS = ['Manual', 'Automática'];
const FUELS = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico'];
const BODIES = ['Sedán', 'Hatchback', 'SUV'];
const STATUSES = ['disponible', 'apartado', 'vendido'];
// vendido never shows in the public catalog: a sold car must not stay listed (risk R4).
const PUBLIC_STATUSES = ['disponible', 'apartado'];

module.exports = { COLORS, TRANSMISSIONS, FUELS, BODIES, STATUSES, PUBLIC_STATUSES };
