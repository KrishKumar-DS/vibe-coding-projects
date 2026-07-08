import { createRing } from './ring.js';
import { palette } from './palette.js';

const UNITS = [
  { key: 'hours', durationMs: 86_400_000, max: 24, pad: 2, label: 'HRS' },
  { key: 'minutes', durationMs: 3_600_000, max: 60, pad: 2, label: 'MIN' },
  { key: 'seconds', durationMs: 60_000, max: 60, pad: 2, label: 'SEC' }
];

const rings = [];
const clockEl = document.querySelector('.clock');

UNITS.forEach((unit, index) => {
  const ringEl = document.createElement('section');
  ringEl.className = 'ring';
  ringEl.innerHTML = `
    <div class="ring__track"></div>
    <div class="ring__perimeter"></div>
    <div class="ring__value">00</div>
    <div class="ring__label">${unit.label}</div>
  `;

  const ring = createRing({
    rootEl: ringEl,
    unit: unit.key,
    palette: palette[unit.key],
    durationMs: unit.durationMs
  });

  ring.setValue('00');
  rings.push({ ...unit, ring, el: ringEl });
  clockEl.appendChild(ringEl);
});

function tick(now) {
  UNITS.forEach((unit, index) => {
    rings[index].ring.update(now);

    const hour = unit.key === 'hours' ? new Date().getHours() :
      unit.key === 'minutes' ? new Date().getMinutes() :
      new Date().getSeconds();

    const padded = String(hour).padStart(unit.pad, '0');
    rings[index].ring.setValue(padded);
  });

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);