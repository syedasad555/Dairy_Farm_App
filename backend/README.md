# Farm Fresh Dairy & Organic Store - Backend API

## Overview

This is the backend API for the Farm Fresh Dairy & Organic Products Delivery Application. Built with Node.js, Express, and MongoDB.

## Features

- **Authentication**: JWT-based authentication with bcrypt password encryption
- **User Management**: Customer, Delivery Partner, and Admin roles
- **Product Management**: CRUD operations for dairy, meat, poultry, and grocery products
- **Order Management**: Complete order lifecycle with tracking
- **Delivery Management**: Route optimization and delivery partner management
- **Billing System**: Monthly statement generation and payment tracking
- **Notifications**: Firebase Cloud Messaging integration
- **Multi-language Support**: English, Telugu, and Hindi

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT + bcrypt
- **Notifications**: Firebase Cloud Messaging
- **Cloud Storage**: AWS S3 (for images)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
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

3. Start the development server:
```bash
npm run dev
```

4. For production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/fcm-token` - Update FCM token

### Users
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Update password
- `POST /api/users/addresses` - Add address
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address
- `PUT /api/users/location` - Update location (delivery partner)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `PUT /api/products/:id/stock` - Update stock (admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/delivery-proof` - Submit delivery proof
- `POST /api/orders/:id/rate` - Rate order

### Deliveries
- `GET /api/deliveries/today` - Get today's deliveries
- `GET /api/deliveries/pending` - Get pending deliveries
- `GET /api/deliveries/completed` - Get completed deliveries
- `POST /api/deliveries/optimize-route` - Optimize delivery route
- `PUT /api/deliveries/:id/status` - Update delivery status
- `PUT /api/deliveries/:id/location` - Update location

### Billing
- `POST /api/billing/generate-statement` - Generate monthly statement
- `GET /api/billing` - Get all statements (admin)
- `GET /api/billing/:id` - Get single statement
- `GET /api/billing/customer/:customerId` - Get customer statements
- `PUT /api/billing/:id/payment` - Record payment
- `PUT /api/billing/:id/status` - Update payment status
- `GET /api/billing/reports/outstanding` - Get outstanding report

### Admin
- `GET /api/admin/dashboard` - Get dashboard overview
- `GET /api/admin/pending-approvals` - Get pending approvals
- `PUT /api/admin/approve-customer/:userId` - Approve customer
- `PUT /api/admin/reject-customer/:userId` - Reject customer
- `POST /api/admin/delivery-partners` - Create delivery partner
- `GET /api/admin/delivery-partners` - Get delivery partners
- `PUT /api/admin/delivery-partners/:userId` - Update delivery partner
- `DELETE /api/admin/delivery-partners/:userId` - Delete delivery partner
- `PUT /api/admin/delivery-partners/:userId/reset-password` - Reset password
- `GET /api/admin/analytics` - Get analytics

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread` - Get unread notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `POST /api/notifications/send` - Send notification

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

## Security

- Passwords encrypted with bcrypt
- JWT token authentication
- Role-based access control
- Input validation
- Error handling

## Development

The API runs on port 5000 by default. Change the PORT in the `.env` file if needed.

## License

ISC
