// Shared colour palette. Every text/background pair used in the app was checked
// against WCAG 2.2 AA: at least 4.5:1 for text, 3:1 for borders and the battery bar.
// If you add a colour, check it first (e.g. https://webaim.org/resources/contrastchecker/)
// and note the ratio here.
export const colors = {
  background: '#FFFFFF',
  surface: '#F3F5F9', // cards; text 14.3:1, textMuted 6.9:1
  text: '#1B2430', // 15.7:1 on background
  textMuted: '#4A5565', // 7.6:1 on background
  primary: '#2B5AAE', // 6.6:1 on background, buttons and links
  primarySurface: '#E8EEF9', // selected chips; primary text 5.7:1
  onPrimary: '#FFFFFF', // text on primary buttons, 6.6:1
  border: '#7D879A', // 3.6:1, inputs and chip outlines
  focus: '#2B5AAE',
  danger: '#B42318', // 6.6:1
  dangerSurface: '#FDECEA', // danger text 5.8:1
  warning: '#8A4B00', // 6.8:1
  warningSurface: '#FFF4E0', // warning text 6.2:1
  success: '#1E7B45', // 5.3:1
  track: '#D5DAE3', // empty part of the battery bar
  batteryLow: '#B42318', // 4.7:1 on track
  batteryMid: '#8A5A00', // 4.2:1 on track
  batteryHigh: '#1E7B45', // 3.8:1 on track
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

// 44 is the comfortable touch size from the brief (7.2); never go below 24.
export const minTouchSize = 44;
