import { ThemeValue } from '@components/ThemePreference/ThemePreference';

export default function getChartColors(group: string, theme: ThemeValue) {
  switch (group) {
    case 'Failed':
      return theme === 'white' ? '#9f1853' : '#ff7eb6';
    case 'Worse':
      return theme === 'white' ? '#a2191f' : '#DA1E28';
    case 'Passed':
      return theme === 'white' ? '#1192e8' : '#33b1ff';
    case 'Better':
      return theme === 'white' ? '#009D9A' : '#3DDBD9';
    case 'Same':
      return theme === 'white' ? '#C6C6C6' : '#a8a8a8';
    default:
      return theme === 'white' ? '#000' : '#525252';
  }
}
