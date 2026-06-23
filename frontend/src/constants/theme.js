export const lightColors = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  secondary: '#FF8F00',
  accent: '#FFF8E1',
  background: '#F5F7F5',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#5F6368',
  textLight: '#FFFFFF',
  border: '#E8EDE8',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#F57C00',
  info: '#1976D2',
  shadow: 'rgba(46, 125, 50, 0.15)',
  card: '#FFFFFF',
  inputBg: '#F5F7F5',
};

export const darkColors = {
  primary: '#66BB6A',
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  secondary: '#FFB74D',
  accent: '#2C2C2C',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#F5F5F5',
  textSecondary: '#B0B0B0',
  textLight: '#FFFFFF',
  border: '#333333',
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFA726',
  info: '#42A5F5',
  shadow: 'rgba(0, 0, 0, 0.4)',
  card: '#1E1E1E',
  inputBg: '#2C2C2C',
};

// Backward compatibility
export const colors = lightColors;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16 },
  caption: { fontSize: 13 },
  button: { fontSize: 16, fontWeight: '600' },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const borderRadius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};
