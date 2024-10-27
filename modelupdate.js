import mongoose from 'mongoose';
import productModel from './models/productModel.js';
// Connect to MongoDB
mongoose.connect('mongodb+srv://buzzrang000:hazrath@buzzrang.8kpw5.mongodb.net/?retryWrites=true&w=majority&appName=buzzrang');

async function updateCategoryForField() {
    try {
        const result = await productModel.updateMany(
            { categoryfor: { $exists: false } }, 
            { $set: { categoryfor: 'male' } }
        );

        console.log(`Updated ${result.nModified} documents to set categoryfor as "male".`);
    } catch (error) {
        console.error('Error updating documents:', error);
    } finally {
        mongoose.connection.close(); // Close the connection when done
    }
}

updateCategoryForField();
