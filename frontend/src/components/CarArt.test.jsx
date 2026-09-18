import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import CarArt from './CarArt';
import { COLORS } from '../utils/vehicleOptions';
import { SHAPES } from '../utils/carShapes';

describe('CarArt', () => {
  it('pinta la carrocería con el color del auto y usa la silueta de su tipo', () => {
    const { container } = render(<CarArt body="SUV" color="Rojo" />);
    const body = container.querySelector('.car-art-body');

    expect(body).toHaveAttribute('fill', COLORS.Rojo);
    expect(body).toHaveAttribute('d', SHAPES.SUV.body);
  });

  it('cae a un sedán gris con datos desconocidos', () => {
    const { container } = render(<CarArt body="Tanque" color="Fucsia" />);
    const body = container.querySelector('.car-art-body');

    expect(body).toHaveAttribute('fill', COLORS.Gris);
    expect(body).toHaveAttribute('d', SHAPES.Sedán.body);
  });

  it('dibuja dos llantas y es decorativo', () => {
    const { container } = render(<CarArt />);

    expect(container.querySelectorAll('.car-art-tire')).toHaveLength(2);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(Object.keys(SHAPES))('la silueta %s tiene carrocería, cristales y puertas', (name) => {
    expect(SHAPES[name].body).toMatch(/^M/);
    expect(SHAPES[name].windows).toMatch(/^M/);
    expect(SHAPES[name].doors).toMatch(/^M/);
  });
});
