# Local testing WITHOUT cloud billing or S3/Storage setup
# Firebase Emulators run everything on your machine for free.

## Quick start (3 terminals)

### Terminal 1 — Build functions once
```powershell
cd firebase\functions
npm install
npm run build
```

### Terminal 2 — Seed + start emulators
```powershell
cd firebase
npm run emulators:seed
npm run emulators
```

Emulator UI: http://localhost:4000

### Terminal 3 — Start mobile app in emulator mode
```powershell
cd frontend
copy .env.emulator.example .env
npm run start:emulator
```

## Test accounts

| Role | Mobile | Password |
|------|--------|----------|
| Admin | 9999999999 | admin123 |
| Customer | 9876543210 | customer123 |
| Delivery Partner | 9888888888 | partner123 |

Customer address pincode **500001** is assigned to the test delivery partner.

## What works locally

- Login / register / customer approval flow
- Products, cart, orders, pincode assignment, delivery slots
- Delivery proof photo upload (Storage **emulator**, not S3)
- Admin dashboard, products, partners, billing UI
- Cloud Functions callables (when functions emulator is running)

## What needs cloud billing later

- Production Firebase deploy (Blaze plan)
- Real FCM push notifications on physical devices
- Production Storage URLs / PDF reports to cloud bucket

## Troubleshooting

### `Error: An unexpected error has occurred` while downloading Firestore emulator

**Cause:** `ENOSPC: no space left on device` — your **C: drive is almost full** (~71 MB free). The Firestore emulator JAR is **139 MB**. Firebase also uses C: for temp files during download.

**Fix (already in repo):** `npm run emulators:seed` now:
1. Downloads emulator JARs directly to `firebase/.emulator-cache` on **D:**
2. Sets `TEMP`/`TMP` to `firebase/.emulator-temp` on **D:**

**Also free C: space (strongly recommended):**
```powershell
npm cache clean --force
Remove-Item -Recurse -Force "$env:USERPROFILE\.cache\firebase\emulators" -ErrorAction SilentlyContinue
```
Aim for **at least 1 GB free on C:** for Node/npm to work reliably.

### `Cannot find module 'firebase-admin'` during seed

Run once from `firebase/functions`:
```powershell
cd firebase\functions
npm install
```

Then retry from `firebase/`:
```powershell
npm run emulators:seed
```

### Two-step seed (if `emulators:seed` still fails)

**Terminal A** — start emulators and leave running:
```powershell
cd firebase
npm run emulators
```

**Terminal B** — seed while emulators are up:
```powershell
cd firebase
npm run seed
```

## Physical phone on same Wi‑Fi

The app **auto-detects your PC IP** from Expo Go (same IP as the QR code, e.g. `192.168.29.198`).

**You must restart Firebase emulators** so they listen on all interfaces (`0.0.0.0`):
```powershell
cd firebase
npm run emulators
```
Look for `0.0.0.0:9099` in the emulator table — NOT only `127.0.0.1`.

Optional override in `frontend/.env` if auto-detect fails:
```env
EXPO_PUBLIC_EMULATOR_HOST=192.168.29.198
```

## Connection reference

| Service | Port | Purpose |
|---------|------|---------|
| Expo Metro | **8081** | App JS bundle (QR code) |
| Firebase Auth | **9099** | Login / register |
| Firestore | **8080** | Database |
| Functions | **5001** | Cloud Functions |
| Storage | **9199** | File uploads |
| Emulator UI | **4000** | Browser admin only |

There is **no Express `/api` backend**. `api.js` is legacy — the app uses Firebase SDK directly.

## Notes

- This app uses **Firebase Storage**, not AWS S3.
- Emulator data persists in `firebase/emulator-data/` between runs.
- Re-seed anytime: `npm run emulators:seed` (from `firebase/`)
