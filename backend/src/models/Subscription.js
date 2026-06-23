const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
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
  deliverySchedule: {
    type: String,
    enum: ['daily', 'alternate_day', 'weekly', 'custom'],
    required: true
  },
  deliveryDays: [String],
  deliveryTime: {
    start: String,
    end: String
  },
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
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'completed'],
    default: 'active'
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  completedDeliveries: {
    type: Number,
    default: 0
  },
  pricePerDelivery: {
    type: Number,
    required: true
  },
  totalAmount: Number,
  specialInstructions: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate subscription number before saving
subscriptionSchema.pre('save', async function(next) {
  if (!this.subscriptionNumber) {
    const count = await mongoose.model('Subscription').countDocuments();
    this.subscriptionNumber = `SUB${String(count + 1).padStart(6, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
