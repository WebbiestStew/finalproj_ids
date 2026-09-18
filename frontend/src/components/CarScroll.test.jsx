import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import CarScroll from './CarScroll';

describe('CarScroll', () => {
  it('expone la sección con su título y una lista textual de las partes (para lectores de pantalla)', () => {
    render(<CarScroll />);

    const region = screen.getByRole('region', { name: 'Cada parte, a la vista.' });
    const parts = within(region).getAllByRole('listitem');
    expect(parts.map((li) => li.textContent)).toEqual([
      'Carrocería: Año, versión y estado de cada unidad.',
      'Cristales y puertas: Carrocería, color y transmisión, sin adivinar.',
      'Llantas: Kilometraje a la vista, antes de ir a la agencia.',
      'Precio real: El que ves es el que es. Sin llamarle a nadie.',
    ]);
  });

  it('el dibujo es decorativo: oculto para tecnologías de asistencia', () => {
    const { container } = render(<CarScroll />);
    expect(container.querySelector('svg.car-svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('dibuja las dos llantas', () => {
    const { container } = render(<CarScroll />);
    expect(container.querySelectorAll('svg.car-svg g')).toHaveLength(2);
  });
});
