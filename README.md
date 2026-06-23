# MVR Farms

**Fresh. Natural. Farm Direct.**

Complete dairy delivery mobile application rebuilt with Firebase backend and React Native (Expo).

## Architecture

```
Dairy_Farm_App/
├── frontend/                 # React Native (Expo) + TypeScript
│   ├── app/                  # Expo Router screens (feature-based routes)
│   │   ├── (auth)/           # Login, Register
│   │   ├── (customer)/       # Customer dashboard
│   │   ├── (delivery)/       # Delivery partner dashboard
│   │   └── (admin)/          # Admin dashboard
│   └── src/
│       ├── features/         # Feature modules
│       ├── repositories/     # Firestore data access (repository pattern)
│       ├── services/         # Business logic layer
│       ├── stores/           # Zustand state (cart, auth, offline queue)
│       ├── shared/           # Types, utils, components, constants
│       └── lib/              # Firebase, i18n, React Query
├── firebase/                 # Firebase backend (replaces Express/MongoDB)
│   ├── firestore.rules       # Security rules
│   ├── firestore.indexes.json
│   ├── storage.rules
│   └── functions/            # Cloud Functions (TypeScript)
└── backend/                  # Legacy Express/MongoDB (deprecated)
```

## Tech Stack

### Frontend
- React Native (Expo SDK 54)
- TypeScript
- Expo Router + React Navigation
- TanStack Query (React Query)
- Zustand
- React Hook Form + Zod
- NativeWind (Tailwind CSS)
- Firebase JS SDK

### Backend (Firebase only)
- Firebase Authentication (mobile + password via `{mobile}@mvrfarms.app`)
- Cloud Firestore
- Cloud Functions (scheduled jobs, notifications, PDF reports)
- Firebase Cloud Messaging
- Firebase Storage

**No Express. No MongoDB. No JWT. No AWS/S3.**

## User Roles

| Role | Dashboard | Access |
|------|-----------|--------|
| Customer | Products, Cart, Orders, Billing, Profile | After admin approval |
| Delivery Partner | Orders, Navigation, Delivery Proof | Pincode-assigned orders |
| Admin | Full management dashboard | Immediate |

## Firestore Collections

`users` · `addresses` · `products` · `orders` · `subscriptions` · `deliveryPartners` · `feedback` · `complaints` · `notifications` · `reports` · `billingStatements` · `deliveryProofs` · `analytics` · `settings`

## Setup

### 1. Firebase Project

```bash
# Install Firebase CLI
npx -y firebase-tools@latest login

# Create or select project
npx -y firebase-tools@latest use YOUR_PROJECT_ID

# Deploy rules, indexes, and functions
cd firebase
npx -y firebase-tools@latest deploy
```

### 2. Seed Admin User

```bash
cd firebase/functions
npm install
ADMIN_MOBILE=9999999999 ADMIN_PASSWORD=admin123 npm run seed:admin
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in Firebase config values from Firebase Console

npm install
npx expo start
```

### Environment Variables

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## Key Features

- **Auth**: Mobile + password (Firebase Auth), profile in Firestore
- **Customer approval workflow** with admin notifications
- **Pincode-based delivery partner assignment** (automatic)
- **Delivery slots**: Morning 04–08 AM, Evening 04–08 PM
- **Geo validation**: 2km radius for delivery completion
- **Delivery proof**: Photo + GPS + timestamp required
- **Subscriptions**: Admin-managed, daily auto-order generation
- **Billing**: Manual payment tracking, monthly auto-generation
- **PDF reports**: Auto-generated at month end
- **Offline support**: Cached products, orders, addresses, profile
- **i18n**: English, Telugu, Hindi

## Cloud Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `notifyAdminsNewRegistration` | Callable | Notify admin of pending customer |
| `notifyCustomerApproved` | Callable | Push notification on approval |
| `createDeliveryPartner` | Callable | Admin creates partner (Auth + Firestore) |
| `notifyOrderCreated` | Callable | Order notifications |
| `completeDelivery` | Callable | Delivery proof + notifications |
| `generateSubscriptionOrders` | Daily 2 AM | Auto-create subscription orders |
| `generateMonthlyBills` | 1st of month | Generate customer bills |
| `generateMonthlyReport` | 1st of month | PDF report to Storage |
| `updateDailyAnalytics` | Daily 1 AM | Analytics snapshot |

## Theme

| Color | Hex | Usage |
|-------|-----|-------|
| Forest Green | `#2D5016` | Primary |
| Brown | `#8B4513` | Secondary |
| Sky Blue | `#87CEEB` | Accent |
| White | `#FFFFFF` | Background |

## Legacy Backend

The `backend/` folder contains the previous Express/MongoDB implementation and is **deprecated**. All new development uses Firebase exclusively.
