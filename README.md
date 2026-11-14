Social Battery Planner

Project topic: Social Battery Planner, mobile application (iOS and Android).

Social Battery Planner is a mobile app that helps people keep track of their social energy ("social battery"). Users check in on how charged they feel, plan upcoming events with an estimated energy drain, and see each day's plans and tomorrow's expected drain. Insights built from their check-ins and journal show patterns over time and suggest ways to recharge.

Team
Member GitHub Feature area (Deliverable 1)
Hana hh6261 Database and general screens: welcome, log in, registration, onboarding, personalization, home, profile, settings, reminders, privacy & data
Matej mk8763 Check-in screens and languages: battery level, mood wheel, activity
Roko RL3805 Insights and journal: plan ahead, add/edit event, insights (day, week, patterns), recharge suggestions
Technology stack
Part Technology Version
App framework Expo (React Native) + TypeScript Expo SDK 58, React Native 0.88.1, React 19.3, TypeScript 6.0
Navigation Expo Router (file-based routes in src/app/) 58.0
Database SQLite through expo-sqlite (on the device) expo-sqlite 58.0.17, SQLite 3.53.3
External REST API Open-Meteo weather forecast, called with fetch v1
Internationalization i18next + react-i18next + expo-localization 27.1 / 18.0 / 58.0
Images expo-image, expo-image-picker, expo-file-system 58.0
Code quality ESLint (eslint-config-expo) + eslint-plugin-i18next for hard-coded text ESLint 9
Running the app Expo Go on a phone, or an iOS simulator / Android emulator Expo Go for SDK 58
Prerequisites
Node.js 22.13 or newer (Node 24 also works) with npm
Git
Expo Go (SDK 58) on an iPhone or Android phone, or an Android emulator / iOS simulator (Mac only)
Setup and running
bash
git clone https://github.com/hh6261/Social-Battery-Planner.git
cd Social-Battery-Planner
npm install
npx expo start

Scan the QR code with Expo Go (Android: in Expo Go; iPhone: with the Camera app), or press a (Android emulator) or i (iOS simulator).

Environment variables

None are needed. Open-Meteo doesn't use an API key, and the database is local to the phone, so there are no secrets or connection strings. .env.example is included and intentionally has no values.

Database, migrations and seed data

All of this happens automatically the first time the app opens:

Creation: expo-sqlite creates the database file social-battery.db on the device.
Migrations: src/db/client.ts runs every pending migration from src/db/migrations/ (001–006) in order, each in a transaction. The schema version is tracked with SQLite's PRAGMA user_version.
Seed data: initDatabase() (called from src/app/\_layout.tsx) loads realistic, fictional sample data from src/db/seed.ts (event types, moods, check-ins, events and journal entries), but only when those tables are empty, so restarting never duplicates it.

Then tap Create my account to register. Accounts exist only on the device.

Starting over: clear Expo Go's data (Android: Settings → Apps → Expo Go → Storage → Clear data; iPhone: reinstall Expo Go), then reopen the app. Migrations and seed data run again from scratch.

Useful commands
Command What it does
npx expo start -c Start with a cleared bundler cache
npx tsc --noEmit Type-check the project (run after expo start has generated the route types)
npm run lint ESLint, including the check for hard-coded user-visible text

In development builds, Settings → Developer → Database viewer shows every table and runs a Unicode round-trip self-test.

External API: Open-Meteo
Service: Open-Meteo forecast API, GET https://api.open-meteo.com/v1/forecast
Key: none required; nothing to obtain or configure.
Used for: the 7-day forecast on Plan Ahead, with a warning when an outdoor plan is likely to get wet, and the "raining now" note on Recharge suggestions.
Code: src/services/weatherService.ts (service layer: timeout, error types, caching) and src/services/weatherCodes.ts.
Privacy: only the coordinates of a fixed city the user picks (Zagreb, Split, Rijeka, Osijek, Dubrovnik) are sent, never the phone's GPS position or any personal data.
Failure handling: network error, timeout (8 s), rate limit (HTTP 429), server error (5xx), empty result and malformed response each produce their own translated message and a Try again button.
Caching: in memory, 15 minutes for current weather and 60 minutes for daily forecasts, per location rounded to about 1 km.
Terms and attribution: free for non-commercial use within Open-Meteo's fair-use limits. The data is licensed CC BY 4.0, so the app shows "Weather data by Open-Meteo.com" with a link.
Supported locales
Locale Role
English (en) Source language and fallback
Croatian (hr) Real plural rules (one / few / other) and diacritics
German (de) Third locale: text expansion (longest translations)
Translation files: src/i18n/locales/<locale>.json, with semantic, nested keys (e.g. checkin.mood.selectedCount). Plurals use i18next's suffixes (\_one, \_few, \_other, …), which follow each language's real plural rules.
Choosing the language: on first launch, the phone's language if supported, otherwise English. Users change it in Settings → Accessibility → Language. The choice is saved in the database (user_profile.locale) and survives restarts.
Formatting: dates, times, numbers, percentages, lists and sorting go through Intl in src/i18n/format.ts.
Missing keys: fall back to English. In development, a warning is logged for each missing key.
Adding a new locale
Copy src/i18n/locales/en.json to src/i18n/locales/<code>.json and translate every value. Add the plural forms that language needs (e.g. Arabic uses \_zero, \_one, \_two, \_few, \_many, \_other).
In src/i18n/index.ts, import the file, add the code to SUPPORTED_LOCALES, and add it under resources.
In src/screens/profile/SettingsScreen.tsx, add the language to LANGUAGE_OPTIONS, with its name written in that language.
For a right-to-left language, also enable RTL support (I18nManager), test the mirrored layout, and restart the app after switching.
Repository structure
Path Contents
src/app/ Routes (Expo Router): (auth) welcome/login/register, (onboarding), (tabs) home/tracker/insights/profile, checkin/, planner/, insights/, recharge
src/screens/ Screen components for auth, onboarding, home and profile, plus the dev database viewer
src/features/ Check-in, planner, insights and recharge features
src/components/ Shared UI: buttons, cards, dialogs, text fields, chips, toggles, weather card
src/db/ SQLite client, migrations, seed data and data-access modules
src/services/ Weather API service and the account/settings data service
src/i18n/ i18next setup, locale persistence, Intl formatting helpers, translation files
src/context/, src/hooks/ Auth and settings state
src/theme/ Colors, spacing and the light/dark theme with font-size scaling
src/navigation/ Custom tab bar
Known limitations
Functionality
Not fully translated yet: the welcome, log in, registration, onboarding, personalization, home, profile, settings, reminders and privacy screens, and the tab bar labels, still contain hard-coded English. They don't change language, and npm run lint reports them. The check-in, planner, insights and recharge screens are fully translated in all three locales.
No right-to-left locale: the third locale is German (text expansion), not Arabic or Hebrew.
Single account per device, stored locally: there's no server or cloud sync. Passwords are stored only as salted SHA-256 hashes. "Forgot password" works by confirming the email and birthday, because there's no email service.
Reminders are in-app only: a "Tomorrow's plans" pop-up appears over Home each time the app is opened, not as phone notifications.
Calendar connection in Privacy & Data only saves the user's choice. Terms & Conditions and Help & FAQ show "not available yet".
Weather cache lives in memory and resets when the app restarts.
Accessibility issues not yet fixed
No visible keyboard focus: custom controls (buttons, chips, toggles, list rows) have no visible focus indicator for hardware-keyboard use.
Tab bar text scaling is capped: tab bar labels are small (10 pt) and only scale up to 1.2× with the system text size.
Wrong language for screen readers: the untranslated screens are read out in English even when the app is set to Croatian or German.
Dark theme contrast unchecked: dark-theme colors haven't been contrast-checked as thoroughly as the light theme.
Third-party code and attribution
Built with Expo and React Native. The project was created from the Expo template, whose MIT license is kept in LICENSE.
Libraries: Expo Router, expo-sqlite, expo-image, expo-image-picker, expo-file-system, expo-crypto, expo-symbols, @expo/ui, @expo/vector-icons, React Navigation, react-native-svg, react-native-reanimated, i18next, react-i18next and expo-localization, each under its own open-source license.
Weather data: Open-Meteo.com, CC BY 4.0.
AI assistance (Claude) was used for parts of the code and documentation; see the AI usage declaration in the Deliverable 2 document.
