import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected.');

    const email = 'arpansharma917@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User with email ${email} not found. Please register this account first.`);
      process.exit(1);
    }

    user.isAdmin = true;
    await user.save();
    
    console.log(`Successfully promoted ${email} to Admin!`);
    process.exit(0);
  } catch (error) {
    console.error('Error promoting user:', error);
    process.exit(1);
  }
};

makeAdmin();
