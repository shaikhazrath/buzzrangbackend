// filterModel.js
import mongoose from 'mongoose';

const filterSchema = new mongoose.Schema({
  gender: {
    type: String,
    enum: ['All', 'Women', 'Men', 'Unisex', 'Kids'],
    default: 'All',
  },
  category: {
    type: String,
    enum: ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Activewear', 'Sleepwear'],
    default: 'All',
  },
  type: {
    type: String,
    enum: ['All', 'Casual', 'Formal', 'Party', 'Sports', 'Beachwear', 'Traditional'],
    default: 'All',
  },
  size: {
    type: String,
    enum: ['All', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
    default: 'All',
  },
  maxPrice: {
    type: Number,
    default: 100,
  },
  brand: {
    type: String,
    enum: ['All', 'Nike', 'Adidas', 'Puma', 'Zara', 'H&M', 'Levi\'s'], // Add your desired brands here
    default: 'All',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Ensure one filter per user
  },
}, { timestamps: true });

const Filter = mongoose.model('Filter', filterSchema);
export default Filter;
