# Colours and themes

Settings > Display > App theme has four options: **Device**, **Light**, **Dark** and **Colorblind-friendly**.
The choice is saved in `user_settings.theme` (migration `009_colorblind_theme.ts` added the fourth value).

## Brand palette (light theme)

| Name | Hex | Used for |
| --- | --- | --- |
| Almond Cream | `#FFE8D6` | cards (the page background is a lighter cream, `#FFF8F2`) |
| Desert Sand | `#DDBEA9` | dividers, selected chips (lighter tint) |
| Light Bronze | `#CB997E` | hard offset shadows, battery fill, accents |
| Ash Grey | `#B7B7A4` | secondary buttons ("Cancel") |
| Dry Sage | `#A5A58D` | quiet fills: switch track when off, logo disc, avatar |
| Dusty Olive | `#6B705C` and darker shades | text, borders, primary buttons |

Small details (eyebrow labels, small icons, inactive tab labels) use the `detail` colour, a darker bronze `#7E4B33`,
so they stay readable on the light background.

## Where the colours live

- `src/theme/tokens.ts`: the three palettes (`lightPalette`, `darkPalette`, `colorblindPalette`). Change colours only here.
- `src/theme/ThemeProvider.tsx`: picks the palette from Settings; `useTheme()` and `makeStyles()` give them to screens.
- `src/theme/legacy.ts`: lets the Insights, Plan ahead and Recharge screens (written before the theme existed) use the same palette,
  2px outlines, rounded corners and the font size setting.

## Colorblind-friendly theme

Built on the Okabe-Ito colours: blue (`#0072B2`) and vermillion (`#A63D00`) instead of green and red, a neutral grey
for the middle battery band, black text on white and sky-blue shadows. Information is also always written as text
(for example "Low", "Drains me"), so colour is never the only signal.

## Contrast

Every text/background pair was calculated against WCAG 2.2 AA (4.5:1 for text, 3:1 for borders and the battery bar)
for all three palettes. Check a pair again (https://webaim.org/resources/contrastchecker/) before changing a colour.
