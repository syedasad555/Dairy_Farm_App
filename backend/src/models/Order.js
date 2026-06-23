const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  deliveryAddress: {
    addressLine: String,
    city: String,
    village: String,
    town: String,
    state: String,
    pincode: String,
    landmark: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  orderStatus: {
    type: String,
    enum: ['received', 'preparing', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'received'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'unpaid'],
    default: 'unpaid'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  deliveryNotes: String,
  specialInstructions: String,
  // Delivery proof
  deliveryProof: {
    image: String,
    gpsCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    timestamp: Date
  },
  // Customer rating
  customerRating: {
    rating: {
      type: Number,
      min: 0,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  // Delivery partner rating
  deliveryPartnerRating: {
    rating: {
      type: Number,
      min: 0,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  isSubscription: {
    type: Boolean,
    default: false
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${String(count + 1).padStart(6, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Index for geospatial queries
orderSchema.index({ 'deliveryAddress.location': '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);
