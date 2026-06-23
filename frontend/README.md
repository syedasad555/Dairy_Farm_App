# MVR Farms — Mobile App

React Native (Expo) frontend for MVR Farms dairy delivery platform.

## Quick Start

```bash
npm install --legacy-peer-deps
cp .env.example .env
# Add Firebase credentials to .env

npx expo start
```

## Assets

Add the following to `assets/` before building:
- `icon.png` (1024×1024)
- `splash.png` (1284×2778)
- `adaptive-icon.png` (1024×1024)
- `favicon.png` (48×48)

## Project Structure

```
app/                    # Expo Router screens
  (auth)/               # Login, Register
  (customer)/           # Customer tabs
  (delivery)/           # Delivery partner tabs
  (admin)/              # Admin stack screens
src/
  repositories/         # Firestore repository pattern
  services/             # Business logic
  stores/               # Zustand (cart, auth, offline)
  shared/               # Types, utils, UI components
  lib/                  # Firebase config, i18n, React Query
```

## Auth Note

Firebase Auth uses email/password internally with format `{mobile}@mvrfarms.app`.
User profiles (without passwords) are stored in Firestore `users` collection.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run lint` | TypeScript check |
