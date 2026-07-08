function createRing({ rootEl, unit, palette, durationMs }) {
  const ringEl = rootEl;
  const perimeterEl = ringEl.querySelector('.ring__perimeter');
  const valueEl = ringEl.querySelector('.ring__value');

  const { base, bright, dim } = palette;

  ringEl.style.setProperty('--accent', base);
  ringEl.style.setProperty('--accent-bright', bright);
  ringEl.style.setProperty('--accent-dim', dim);
  ringEl.classList.add('ring--' + unit);

  return {
    update(now) {
      const cycle = durationMs;
      const elapsed = now % cycle;
      const phaseDeg = (elapsed / cycle) * 360;

      perimeterEl.style.setProperty('--phase', phaseDeg + 'deg');

      return { phaseDeg, elapsed };
    },

    setValue(text) {
      valueEl.textContent = text;
    }
  };
}

export { createRing };