import { useRef } from 'react';
import { motion, transform, useMotionValue, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { GROUND, SHAPES, WHEEL_CENTERS } from '../utils/carShapes';
import './CarScroll.css';

// Scroll-driven signature: the section pins while its progress (0→1) draws the car
// part by part over a faint blueprint of the whole thing. Progress is tied 1:1 to
// the scroll position, so it can be scrubbed forward and back at any speed.
const { body: BODY, windows: WINDOWS, doors: DOOR, headlight: HEADLIGHT } = SHAPES['Sedán'];
const WHEELS = WHEEL_CENTERS;

// Five spokes, 72° apart, between the hub (r17) and the tire (r44)
const SPOKES = [0, 72, 144, 216, 288]
  .map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return `M${(17 * Math.sin(rad)).toFixed(1)} ${(-17 * Math.cos(rad)).toFixed(1)} L${(44 * Math.sin(rad)).toFixed(1)} ${(-44 * Math.cos(rad)).toFixed(1)}`;
  })
  .join(' ');

const CAPTIONS = [
  { range: [0, 0.32], title: 'Carrocería', text: 'Año, versión y estado de cada unidad.' },
  { range: [0.32, 0.5], title: 'Cristales y puertas', text: 'Carrocería, color y transmisión, sin adivinar.' },
  { range: [0.5, 0.78], title: 'Llantas', text: 'Kilometraje a la vista, antes de ir a la agencia.' },
  { range: [0.78, 1], title: 'Precio real', text: 'El que ves es el que es. Sin llamarle a nadie.' },
];

function Stroke({ progress, range, as = 'path', accent, ...props }) {
  const pathLength = useTransform(progress, range, [0, 1], { clamp: true });
  // A zero-length stroke with round caps still paints a dot; hide it until its part starts.
  const opacity = useTransform(pathLength, (v) => (v > 0 ? 1 : 0));
  const Drawn = motion[as];
  const Ghost = as;
  return (
    <>
      <Ghost className="ghost" {...props} />
      <Drawn className={accent ? 'drawn accent' : 'drawn'} style={{ pathLength, opacity }} {...props} />
    </>
  );
}

function Wheel({ progress, cx }) {
  // Function transforms (here and below) keep every value on the same JS scroll path
  // as the strokes, instead of a native scroll timeline that drifts near the end.
  const rotate = useTransform(progress, (p) => transform(p, [0.45, 1], [0, 540]));
  return (
    <motion.g style={{ x: cx, y: 196, rotate, transformBox: 'fill-box', transformOrigin: 'center' }}>
      <Stroke progress={progress} as="circle" range={[0.45, 0.62]} cx={0} cy={0} r={44} />
      <Stroke progress={progress} as="circle" range={[0.58, 0.68]} cx={0} cy={0} r={17} />
      <Stroke progress={progress} range={[0.62, 0.74]} d={SPOKES} />
    </motion.g>
  );
}

function Caption({ progress, range: [start, end], title, text, last }) {
  const fade = 0.04;
  const inRange = last ? [start, start + fade] : [start, start + fade, end - fade, end];
  const outRange = last ? [0, 1] : [0, 1, 1, 0];
  const opacity = useTransform(progress, (p) => transform(p, inRange, outRange));
  const y = useTransform(progress, (p) => transform(p, [start, start + fade], [10, 0]));
  return (
    <motion.div className="car-caption" style={{ opacity, y }}>
      <h3>{title}</h3>
      <p>{text}</p>
    </motion.div>
  );
}

function CarSvg({ progress }) {
  return (
    <svg className="car-svg" viewBox="0 0 812 250" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <Stroke progress={progress} range={[0.02, 0.32]} d={BODY} />
      <Stroke progress={progress} range={[0.3, 0.42]} d={WINDOWS} />
      <Stroke progress={progress} range={[0.4, 0.5]} d={DOOR} />
      {WHEELS.map((cx) => (
        <Wheel key={cx} progress={progress} cx={cx} />
      ))}
      <Stroke progress={progress} range={[0.74, 0.82]} d={HEADLIGHT} accent />
      <Stroke progress={progress} range={[0.8, 0.92]} d={GROUND} />
    </svg>
  );
}

export default function CarScroll() {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const finished = useMotionValue(1);

  // Reduced motion: no pinning or scrubbing — the finished car plus the four
  // descriptions, all visible at once.
  if (prefersReducedMotion) {
    return (
      <section className="car-static container" aria-labelledby="car-title">
        <h2 id="car-title">Cada parte, a la vista.</h2>
        <CarSvg progress={finished} />
        <ul className="car-list">
          {CAPTIONS.map((c) => (
            <li key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section ref={ref} className="car-scroll" aria-labelledby="car-title">
      <div className="car-stage">
        <div className="car-head">
          <p className="car-kicker">Así es cada ficha del catálogo</p>
          <h2 id="car-title">Cada parte, a la vista.</h2>
        </div>

        <CarSvg progress={scrollYProgress} />

        <div className="car-captions" aria-hidden="true">
          {CAPTIONS.map((c, i) => (
            <Caption key={c.title} progress={scrollYProgress} {...c} last={i === CAPTIONS.length - 1} />
          ))}
        </div>

        <ul className="sr-only">
          {CAPTIONS.map((c) => (
            <li key={c.title}>
              {c.title}: {c.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
