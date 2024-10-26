import mongoose from 'mongoose';
import fs from 'fs/promises'; // Use the promises version of fs
import productModel from './models/productModel.js';

// MongoDB connection details
const MONGO_URI = 'mongodb+srv://buzzrang000:hazrath@buzzrang.8kpw5.mongodb.net/?retryWrites=true&w=majority&appName=buzzrang'; // Replace with your MongoDB connection string

// Connect to MongoDB
await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
console.log('MongoDB connected');

// Function to insert data into MongoDB
async function insertData(data) {
  try {
    const result = await productModel.insertMany(data);
    console.log(`Inserted ${result.length} documents.`);
  } catch (error) {
    console.error('Error inserting data:', error);
  }
}

// Main function to read JSON data and push to MongoDB
async function main() {
  try {
    // Load data from JSON file
    const data = await fs.readFile('data.json', 'utf8');
    const jsonData = JSON.parse(data);

    // Transform the data if necessary
    const transformedData = jsonData.map(item => ({
      name: item.name,
      description: item.description,
      price: parseFloat(item.price.replace('INR ', '').replace(',', '')), // Convert price to float
      images: item.imageUrl, // Assuming you want to use imageUrl for images field
      category: item.category,
      brand: item.brand,
      gender: item.gender,
      productWebsiteLink: item.productWebsiteLink,
    }));

    // Insert transformed data into MongoDB
    await insertData(transformedData);
  } catch (error) {
    console.error('Error processing the file:', error);
  } finally {
    mongoose.connection.close(); // Close the MongoDB connection
  }
}

// Run the main function
main();
