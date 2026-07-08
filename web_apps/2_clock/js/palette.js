const palette = {
  hours: {
    base: '#9b6dff',
    bright: '#c9a8ff',
    dim: '#5a3da6'
  },
  minutes: {
    base: '#46d3ff',
    bright: '#9be9ff',
    dim: '#1f7fa3'
  },
  seconds: {
    base: '#ffb347',
    bright: '#ffe0a8',
    dim: '#a06a1f'
  }
};

function cssVarsFor(unit) {
  const { base, bright, dim } = palette[unit] || {};

  if (!base || !bright || !dim) {
    return {};
  }

  return {
    '--accent': base,
    '--accent-bright': bright,
    '--accent-dim': dim
  };
}

function buildGradient(phaseDeg, unit) {
  const { base, bright, dim } = palette[unit] || {};

  return `conic-gradient(
    from ${phaseDeg}deg,
    ${bright} 0deg,
    ${base} 60deg,
    ${dim} 180deg,
    transparent 300deg
  )`;
}

export { palette, cssVarsFor, buildGradient };