import { COLORS } from '../utils/vehicleOptions';
import { GROUND, SHAPES, WHEEL_CENTERS } from '../utils/carShapes';
import './CarArt.css';

// Illustration, not a photo: the car's body type picks the silhouette and its
// color tints the paint. Decorative — the text next to it carries the meaning.
export default function CarArt({ body = 'Sedán', color = 'Gris', className = '' }) {
  const shape = SHAPES[body] || SHAPES.Sedán;
  const paint = COLORS[color] || COLORS.Gris;

  return (
    <svg className={`car-art ${className}`} viewBox="0 0 812 262" aria-hidden="true" focusable="false">
      <ellipse className="car-art-shadow" cx="406" cy="244" rx="350" ry="11" />
      <path className="car-art-body" d={shape.body} fill={paint} />
      <path className="car-art-glass" d={shape.windows} />
      <path className="car-art-lines" d={shape.doors} fill="none" />
      <path className="car-art-light" d={shape.headlight} fill="none" />
      <path className="car-art-ground" d={GROUND} fill="none" />
      {WHEEL_CENTERS.map((cx) => (
        <g key={cx} transform={`translate(${cx} 196)`}>
          <path className="car-art-well" d="M-60 0 A60 60 0 0 1 60 0 Z" />
          <circle className="car-art-tire" r="44" />
          <circle className="car-art-rim" r="27" />
          <circle className="car-art-hub" r="9" />
        </g>
      ))}
    </svg>
  );
}
