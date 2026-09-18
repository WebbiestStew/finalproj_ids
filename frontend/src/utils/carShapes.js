// Three silhouettes on one 812×250 grid (wheels always at x=168 and x=632, r=44),
// so any body type can share the same wheels, ground line and scroll animation.
export const WHEEL_CENTERS = [168, 632];
export const GROUND = 'M0 240 L812 240';

const BASE_Y = 196; // where the body meets the wheel line
const BOTTOM = 'L772 196 L692 196 A60 60 0 0 0 572 196 L228 196 A60 60 0 0 0 108 196 Z';

// Makes a body taller without distorting the round wheel arches: every point above
// the wheel line moves up by `factor`; arc radii and points on the line stay put.
// (Paths here are absolute M/L/C/A/Z only.)
function stretch(path, factor) {
  const lift = (y) => +(BASE_Y - (BASE_Y - y) * factor).toFixed(1);
  return path
    .replace(/([MLCA])([^MLCAZ]*)/g, (_, command, args) => {
      const n = args.trim().split(/[\s,]+/).map(Number);
      if (command === 'A') n[6] = lift(n[6]);
      else for (let i = 1; i < n.length; i += 2) n[i] = lift(n[i]);
      return `${command}${n.join(' ')} `;
    })
    .trim();
}

const build = (factor, { body, windows, doors, headlight }) => ({
  body: stretch(body, factor),
  windows: stretch(windows, factor),
  doors: stretch(doors, factor),
  headlight: stretch(headlight, factor),
});

export const SHAPES = {
  Sedán: build(1.22, {
    body: `M40 196 L40 164 C40 144 55 136 82 132 L204 120 C252 66 304 46 384 46 L472 46 C542 48 592 82 632 114 L732 124 C760 128 772 142 772 162 ${BOTTOM}`,
    windows: 'M226 118 C262 76 306 60 384 60 L468 60 C524 62 562 88 592 114 Z',
    doors: 'M392 62 L392 118 M204 120 L226 118 M420 150 L452 150 M500 150 L540 150',
    headlight: 'M742 138 L764 142',
  }),
  Hatchback: build(1.25, {
    body: `M44 196 L44 158 C44 142 56 134 78 130 C104 124 126 84 172 60 C198 48 236 46 300 46 L470 46 C540 48 592 84 630 114 L732 124 C760 128 772 142 772 162 ${BOTTOM}`,
    windows: 'M150 112 C176 76 204 62 296 60 L466 60 C522 62 562 88 592 114 Z',
    doors: 'M380 62 L380 116 M420 150 L452 150 M500 150 L540 150',
    headlight: 'M742 138 L764 142',
  }),
  SUV: build(1.17, {
    body: `M40 196 L40 142 C40 128 50 120 68 116 L116 110 L136 52 C140 38 154 32 172 32 L468 32 C506 32 530 46 552 76 L608 116 L732 124 C760 128 772 142 772 162 ${BOTTOM}`,
    windows: 'M148 108 L162 60 C164 54 170 50 180 50 L464 50 C494 50 514 62 532 84 L572 112 Z',
    doors: 'M322 52 L322 110 M446 52 L446 110 M420 152 L452 152 M500 152 L540 152',
    headlight: 'M742 138 L764 142',
  }),
};
