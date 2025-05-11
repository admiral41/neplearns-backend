const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to Database');
    await initializeAdminAccount();
  } catch (error) {
    console.error('Database Connection Error:', error);
    process.exit(1);
  }
};

const initializeAdminAccount = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'Admin' });
    
    if (existingAdmin) {
      console.log('Admin already exists');
      return;
    }

    const admin = new User({
      username: 'admin',
      email: 'admin@neplearns.com',
      password: 'Nep@learns@@9800!12', 
      role: 'Admin',
      isApproved: true,
    });

    await admin.save(); 
    console.log('Default Admin created successfully');
  } catch (error) {
    console.error('Admin initialization error:', error);
  }
};

module.exports = connectDB;