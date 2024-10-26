import mongoose from 'mongoose';
import fs from 'fs';
import Clips from './models/clipsModel.js';

// Connect to your MongoDB database
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://shaikhazrathali123:hazrath@cluster0.8lea2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { // 
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    // Read the data from the JSON file
    const data = JSON.parse(fs.readFileSync('vogueindia_reels.json', 'utf-8'));

    // Insert data into the database
    await Clips.insertMany(data);
    console.log('Data imported successfully');
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    mongoose.connection.close();
  }
};

const run = async () => {
  await connectDB();
  await importData();
};

run();
