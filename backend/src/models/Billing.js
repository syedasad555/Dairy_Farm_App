const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  statementNumber: {
    type: String,
    unique: true,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  orders: [{
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    orderNumber: String,
    orderDate: Date,
    deliveryDate: Date,
    items: [{
      productName: String,
      quantity: Number,
      price: Number
    }],
    amount: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  paymentHistory: [{
    amount: Number,
    paymentDate: Date,
    paymentMethod: String,
    notes: String,
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  collectionNotes: String,
  dueDate: Date,
  generatedAt: {
    type: Date,
    default: Date.now
  },
  pdfUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate statement number before saving
billingSchema.pre('save', async function(next) {
  if (!this.statementNumber) {
    const count = await mongoose.model('Billing').countDocuments();
    this.statementNumber = `STMT${String(count + 1).padStart(6, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Billing', billingSchema);
