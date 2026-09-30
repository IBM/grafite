const HIGH = { light: [0x01, 0x27, 0x49], dark: [0xba, 0xe6, 0xff] } as const; // Pass rate 100%

const getHeatmapColor = (value: number, isDark = false) => {
  const alpha = Math.min(Math.max(value, 0), 100) / 100;
  const [r, g, b] = HIGH[isDark ? 'dark' : 'light'];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default getHeatmapColor;
