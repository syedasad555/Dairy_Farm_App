const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  category: {
    type: String,
    enum: ['dairy', 'meat', 'poultry', 'grocery'],
    required: [true, 'Product category is required']
  },
  subCategory: {
    type: String,
    required: [true, 'Product subcategory is required']
  },
  // Variants for different sizes/quantities
  variants: [{
    size: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    stock: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: ['ml', 'liter', 'g', 'kg', 'pieces', 'pack'],
      default: 'pieces'
    }
  }],
  images: [{
    type: String
  }],
  farmInfo: {
    farmName: {
      type: String,
      required: true
    },
    farmAddress: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    supportNumber: {
      type: String
    }
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  isFreshArrival: {
    type: Boolean,
    default: false
  },
  nutritionalInfo: {
    calories: String,
    protein: String,
    fat: String,
    carbohydrates: String
  },
  storageInstructions: String,
  shelfLife: String,
  tags: [String],
  totalOrders: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
