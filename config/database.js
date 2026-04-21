const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Remove deprecated options for Mongoose 7+
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB Atlas Connected Successfully!`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌍 Host: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Failed: ${error.message}`);
    // Don't exit the process, just log the error
    console.error('Please check your MONGODB_URI in .env file');
  }
};

module.exports = connectDB;
