# Farm Fresh Dairy & Organic Products Delivery Application

## Business Name

Farm Fresh Dairy & Organic Store

## Tagline

Pure. Fresh. Natural. Delivered To Your Doorstep.

## Overview

A comprehensive mobile application for dairy and organic products delivery, featuring three role-based dashboards: Customer, Delivery Partner, and Admin. The application is built with React Native (frontend) and Node.js/Express (backend), using MongoDB for data storage.

## Features

### Customer Dashboard
- Browse products by category (Dairy, Meat, Poultry, Grocery)
- Search and filter products
- Add products to cart
- Place orders with multiple address options
- Real-time order tracking
- Monthly billing statements
- Push notifications
- Multi-language support (English, Telugu, Hindi)

### Delivery Partner Dashboard
- View assigned deliveries
- Smart route optimization
- Delivery status tracking
- Photo proof with GPS coordinates
- Delivery history

### Admin Dashboard
- Customer account approvals
- Product management (CRUD operations)
- Delivery partner management
- Order management and tracking
- Billing and payment tracking
- Analytics and reporting

## Technology Stack

### Frontend
- React Native with Expo
- React Navigation
- Axios for API calls
- AsyncStorage for local storage
- React Native Firebase for notifications
- React Native Maps for location services

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- JWT Authentication
- bcrypt for password encryption
- Firebase Cloud Messaging
- Multer for file uploads

### Cloud Services
- AWS (planned for S3 storage)
- Firebase (for push notifications)
- Google Maps API (for location services)

## Project Structure

```
Dairy_Farm_app/
├── backend/                        # Node.js/Express backend
│   ├── src/
│   │   ├── config/                 # Configuration files
│   │   ├── controllers/            # Route controllers
│   │   ├── middleware/             # Custom middleware
│   │   ├── models/                 # Mongoose models
│   │   ├── routes/                 # API routes
│   │   ├── services/               # Business logic
│   │   └── utils/                  # Utility functions
│   ├── .env                        # Environment variables
│   ├── package.json
│   └── README.md
├── frontend/                       # React Native mobile app
│   ├── src/
│   │   ├── screens/                # Screen components
│   │   │   ├── auth/               # Authentication screens
│   │   │   ├── customer/           # Customer dashboard
│   │   │   ├── delivery/           # Delivery partner dashboard
│   │   │   └── admin/              # Admin dashboard
│   │   ├── navigation/             # Navigation configuration
│   │   ├── contexts/               # Context providers
│   │   ├── services/               # API services
│   │   ├── utils/                  # Utility functions
│   │   ├── constants/              # App constants
│   │   └── assets/                 # Images, fonts
│   ├── App.js                      # Main entry point
│   ├── app.json                    # Expo configuration
│   ├── package.json
│   └── README.md
└── README.md                       # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Expo CLI
- React Native CLI

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/farm-fresh-dairy
JWT_SECRET=your_jwt_secret_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=farm-fresh-dairy-uploads
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
API_URL=http://localhost:5000/api
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

4. Start the Expo development server:
```bash
npm start
```

5. Run the app:
- iOS: `npm run ios`
- Android: `npm run android`
- Web: `npm run web`

## Authentication System

### Registration Flow
1. Customer registers with mobile number, password, and address
2. Status set to "PENDING APPROVAL"
3. Admin reviews registration
4. Admin approves/rejects
5. Customer receives push notification
6. Customer can login after approval

### Login Flow
1. User enters mobile number and password
2. Backend validates credentials
3. JWT token generated and returned
4. Token stored in AsyncStorage
5. App loads appropriate dashboard based on user role

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/fcm-token` - Update FCM token

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/delivery-proof` - Submit delivery proof

### Deliveries
- `GET /api/deliveries/today` - Get today's deliveries
- `GET /api/deliveries/pending` - Get pending deliveries
- `POST /api/deliveries/optimize-route` - Optimize route
- `PUT /api/deliveries/:id/status` - Update delivery status

### Billing
- `POST /api/billing/generate-statement` - Generate monthly statement
- `GET /api/billing` - Get all statements (admin)
- `PUT /api/billing/:id/payment` - Record payment

### Admin
- `GET /api/admin/dashboard` - Get dashboard overview
- `GET /api/admin/pending-approvals` - Get pending approvals
- `PUT /api/admin/approve-customer/:userId` - Approve customer
- `POST /api/admin/delivery-partners` - Create delivery partner
- `GET /api/admin/analytics` - Get analytics

## Database Models

### User
- Customer, Delivery Partner, Admin roles
- Address management
- Location tracking
- Notification preferences

### Product
- Categories: Dairy, Meat, Poultry, Grocery
- Multiple variants with pricing
- Farm information
- Stock management

### Order
- Order items and pricing
- Delivery address
- Order status tracking
- Delivery proof
- Ratings

### Delivery
- Route optimization
- Location tracking
- Delivery status

### Billing
- Monthly statements
- Payment tracking
- Collection reports

### Subscription
- Milk subscriptions
- Scheduled deliveries
- Recurring orders

## Security Features

- Password encryption with bcrypt
- JWT token authentication
- Role-based access control
- Input validation
- Error handling
- No OTP/SMS verification (as per requirements)

## Performance Requirements

- App launch under 2 seconds
- Fast search functionality
- Real-time tracking
- Real-time notifications
- Secure encrypted data
- Support for 10,000+ customers
- High availability
- Scalable architecture
- Offline synchronization (planned)

## Future Enhancements

- [ ] Complete multi-language implementation
- [ ] Google Maps integration for live tracking
- [ ] AWS S3 for image storage
- [ ] Subscription milk delivery
- [ ] Customer and delivery partner ratings
- [ ] Loyalty program
- [ ] Customer support chat
- [ ] Dark mode
- [ ] Complete offline synchronization

## Contributing

This is a proprietary project. For contributions, please contact the development team.

## License

ISC

## Support

For support and queries, please contact the development team.
