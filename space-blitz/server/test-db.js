
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/space-blitz');
  const users = await mongoose.connection.db.collection('users').countDocuments();
  const games = await mongoose.connection.db.collection('games').countDocuments();
  console.log('Database connection successful!');
  console.log('Users:', users);
  console.log('Games:', games);
  await mongoose.connection.close();
} catch (error) {
  console.error('Database connection failed:', error.message);
}

