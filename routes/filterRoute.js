import express from 'express';
import Filter from '../models/FashionNewsModel.js';
import User from '../models/userModel.js';

const router = express.Router();

// Route to create or update a user's filter
router.put('/', async (req, res) => {
  const { gender, category, type, size, maxPrice, brand } = req.body;

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user already has a filter
    let filter = await Filter.findOne({ user: user._id });

    if (!filter) {
      // Create a new filter with provided values or defaults
      filter = new Filter({
        user: user._id,
        gender: gender || 'All',      // Default to 'All' if not provided
        category: category || 'All',  // Default to 'All' if not provided
        type: type || 'All',          // Default to 'All' if not provided
        size: size || 'All',          // Default to 'All' if not provided
        maxPrice: maxPrice || 100,    // Default to 100 if not provided
        brand: brand || 'All',        // Default to 'All' if not provided
      });
    } else {
      // Update the existing filter
      filter.gender = gender || filter.gender;
      filter.category = category || filter.category;
      filter.type = type || filter.type;
      filter.size = size || filter.size;
      filter.maxPrice = maxPrice || filter.maxPrice;
      filter.brand = brand || filter.brand; // Update brand
    }

    // Save the filter to the database
    const savedFilter = await filter.save();

    res.status(200).json({
      message: 'Filter saved successfully',
      filter: savedFilter,
    });
  } catch (error) {
    console.error('Error saving filter:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route to get a user's filter or create one if not found
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the filter associated with the user
    let filter = await Filter.findOne({ user: user._id });
    
    if (!filter) {
      // Create a new filter with default values if it doesn't exist
      filter = new Filter({
        user: user._id,
        gender: 'All',      // Default gender
        category: 'All',    // Default category
        type: 'All',        // Default type
        size: 'All',        // Default size
        maxPrice: 100,      // Default max price
        brand: 'All',       // Default brand
      });

      // Save the new filter to the database
      await filter.save();
    }

    res.status(200).json({
      message: 'Filter retrieved successfully',
      filter,
    });
  } catch (error) {
    console.error('Error retrieving filter:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
