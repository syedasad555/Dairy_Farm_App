require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminMobile = '6301196776';
    
    let admin = await User.findOne({ mobileNumber: adminMobile });
    if (admin) {
      console.log('Admin already exists. Updating password and role...');
      admin.password = 'Syedasad123@';
      admin.role = 'admin';
      admin.status = 'active';
      await admin.save();
      console.log('Admin updated successfully.');
    } else {
      console.log('Creating new admin user...');
      admin = await User.create({
        fullName: 'System Admin',
        mobileNumber: adminMobile,
        email: 'admin@dairyfarm.com',
        password: 'Syedasad123@',
        role: 'admin',
        status: 'active'
      });
      console.log('Admin created successfully.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
