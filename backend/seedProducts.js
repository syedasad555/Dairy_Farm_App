require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const farmInfo = {
  farmName: 'Farm Fresh Dairy & Organic Store',
  farmAddress: 'Village Road, Guntur District, Andhra Pradesh',
  contactNumber: '9876543210',
  supportNumber: '9876543211'
};

const products = [
  {
    name: 'Pure Buffalo Milk',
    description: 'Fresh pure buffalo milk sourced directly from our farm. Rich in protein and calcium.',
    category: 'dairy', subCategory: 'Buffalo Milk',
    variants: [
      { size: '500ml', price: 35, stock: 100, unit: 'ml' },
      { size: '1 Liter', price: 65, stock: 100, unit: 'liter' },
      { size: '2 Liter', price: 125, stock: 50, unit: 'liter' }
    ],
    images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'],
    farmInfo, isPopular: true, isBestSeller: true
  },
  {
    name: 'Pure Cow Milk',
    description: 'Fresh cow milk from grass-fed cows. Light and nutritious.',
    category: 'dairy', subCategory: 'Cow Milk',
    variants: [
      { size: '500ml', price: 30, stock: 100, unit: 'ml' },
      { size: '1 Liter', price: 55, stock: 100, unit: 'liter' },
      { size: '2 Liter', price: 105, stock: 50, unit: 'liter' }
    ],
    images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'],
    farmInfo, isPopular: true
  },
  {
    name: 'Pure Cow Ghee',
    description: 'Traditional hand-churned cow ghee with rich aroma and taste.',
    category: 'dairy', subCategory: 'Cow Ghee',
    variants: [
      { size: '250g', price: 350, stock: 30, unit: 'g' },
      { size: '500g', price: 650, stock: 20, unit: 'g' },
      { size: '1kg', price: 1200, stock: 10, unit: 'kg' }
    ],
    images: ['https://images.unsplash.com/photo-1589985276374-c77b5b0e8b6a?w=400'],
    farmInfo, isBestSeller: true
  },
  {
    name: 'Pure Buffalo Ghee',
    description: 'Premium buffalo ghee made using traditional methods.',
    category: 'dairy', subCategory: 'Buffalo Ghee',
    variants: [
      { size: '250g', price: 400, stock: 25, unit: 'g' },
      { size: '500g', price: 750, stock: 15, unit: 'g' },
      { size: '1kg', price: 1400, stock: 8, unit: 'kg' }
    ],
    images: ['https://images.unsplash.com/photo-1589985276374-c77b5b0e8b6a?w=400'],
    farmInfo
  },
  {
    name: 'Fresh Paneer',
    description: 'Soft and fresh paneer made daily from pure milk.',
    category: 'dairy', subCategory: 'Paneer',
    variants: [
      { size: '250g', price: 90, stock: 40, unit: 'g' },
      { size: '500g', price: 170, stock: 30, unit: 'g' },
      { size: '1kg', price: 320, stock: 15, unit: 'kg' }
    ],
    images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400'],
    farmInfo, isPopular: true, isFreshArrival: true
  },
  {
    name: 'Fresh Mutton',
    description: 'Farm-raised fresh mutton, cut to order.',
    category: 'meat', subCategory: 'Mutton',
    variants: [
      { size: '500g', price: 400, stock: 20, unit: 'g' },
      { size: '1kg', price: 750, stock: 15, unit: 'kg' },
      { size: 'Custom Quantity', price: 750, stock: 10, unit: 'kg' }
    ],
    images: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400'],
    farmInfo, isFreshArrival: true
  },
  {
    name: 'Natu Kodi Chicken',
    description: 'Free-range country chicken (Natu Kodi) raised naturally.',
    category: 'meat', subCategory: 'Chicken',
    variants: [
      { size: 'Half Chicken', price: 250, stock: 20, unit: 'pieces' },
      { size: 'Full Chicken', price: 450, stock: 15, unit: 'pieces' },
      { size: 'Custom Quantity', price: 450, stock: 10, unit: 'kg' }
    ],
    images: ['https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400'],
    farmInfo, isBestSeller: true
  },
  {
    name: 'Farm Fresh Eggs',
    description: 'Fresh farm eggs from free-range hens.',
    category: 'poultry', subCategory: 'Eggs',
    variants: [
      { size: 'Pack of 6', price: 48, stock: 50, unit: 'pack' },
      { size: 'Pack of 12', price: 90, stock: 40, unit: 'pack' },
      { size: 'Pack of 30', price: 210, stock: 20, unit: 'pack' }
    ],
    images: ['https://images.unsplash.com/photo-1582722877985-97948baf9d8d?w=400'],
    farmInfo, isPopular: true
  },
  {
    name: 'Premium Basmati Rice',
    description: 'Aged premium basmati rice with long grains and rich aroma.',
    category: 'grocery', subCategory: 'Rice',
    variants: [
      { size: '5kg', price: 450, stock: 30, unit: 'kg' },
      { size: '10kg', price: 850, stock: 20, unit: 'kg' },
      { size: '25kg', price: 2000, stock: 10, unit: 'kg' }
    ],
    images: ['https://images.unsplash.com/photo-1586201375767-2b74c7e4aa8e?w=400'],
    farmInfo, isFreshArrival: true
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farm-fresh-dairy');
    console.log('Connected to MongoDB');

    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products successfully`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
