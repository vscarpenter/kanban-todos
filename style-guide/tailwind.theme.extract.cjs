const primitives = require('./tokens/primitives.json');
const semantic = require('./tokens/semantic.json');

const { colors, typography, spacing, sizing, radii, shadows, zIndex, motion, dataViz } = primitives;

const mapColorScale = (scale) =>
  Object.fromEntries(Object.entries(scale).map(([step, value]) => [step, value.hex]));

const spacingScale = (() => {
  const entries = Object.entries(spacing).flatMap(([name, info]) => [
    [name, info.rem],
    [info.alias, info.rem],
  ]);
  return Object.fromEntries(entries);
})();

const fontSizeScale = Object.fromEntries(
  Object.entries(typography.scale.steps).map(([token, meta]) => [
    token,
    [meta.fontSize, { lineHeight: meta.lineHeight, letterSpacing: meta.letterSpacing }],
  ]),
);

const dataVizPalette = dataViz.reduce((acc, swatch, index) => {
  acc[index + 1] = swatch.hex;
  acc[swatch.name.toLowerCase()] = swatch.hex;
  return acc;
}, {});

module.exports = {
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ...Object.fromEntries(
        Object.entries(colors).map(([family, scale]) => [family, mapColorScale(scale)]),
      ),
    },
    fontFamily: {
      sans: typography.families.sans.split(',').map((token) => token.trim()),
      mono: typography.families.mono.split(',').map((token) => token.trim()),
    },
    fontSize: fontSizeScale,
    spacing: spacingScale,
    borderRadius: {
      none: radii.none,
      xs: radii.xs,
      sm: radii.sm,
      md: radii.md,
      lg: radii.lg,
      xl: radii.xl,
      pill: radii.pill,
    },
    boxShadow: shadows,
    zIndex,
    extend: {
      height: {
        'control-sm': sizing.control.sm.rem,
        'control-md': sizing.control.md.rem,
        'control-lg': sizing.control.lg.rem,
      },
      width: {
        'container-sm': sizing.container.sm.rem,
        'container-md': sizing.container.md.rem,
        'container-lg': sizing.container.lg.rem,
        'container-xl': sizing.container.xl.rem,
      },
      transitionDuration: motion.durations,
      transitionTimingFunction: motion.easings,
      dataViz: dataVizPalette,
      semantic: semantic.modes,
    },
  },
};
