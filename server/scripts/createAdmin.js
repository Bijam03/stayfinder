// server/scripts/createAdmin.js
import mongoose from 'mongoose';
import dotenv   from 'dotenv';
import User     from '../models/User.js';

dotenv.config();
await mongoose.connect("mongodb+srv://bijamwarchinmay1432_db_user:Chinmay2024@cluster0.gcts8wg.mongodb.net/stayfinder?retryWrites=true&w=majority&appName=Cluster0");

const existing = await User.findOne({ email: 'admin@stayfinder.com' });
if (existing) {
  // Delete the old admin so we can recreate with correct password
  await User.findOneAndDelete({ email: 'admin@stayfinder.com' });
  console.log('🗑️  Old admin deleted. Recreating...');
}

// Pass plain text password — the User model's pre-save hook will hash it
await User.create({
  name:     'Admin',
  email:    'admin@stayfinder.com',
  password: 'Admin@1234',
  role:     'admin',
});
console.log('✅ Admin created! Email: admin@stayfinder.com | Pass: Admin@1234');
process.exit();