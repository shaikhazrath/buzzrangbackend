import express from 'express';
import productModel from '../models/productModel.js';
import User from '../models/userModel.js';

const router = express.Router();
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized. No active session.' });
};
router.post('/',async (req, res) => {
  try {
    const product = new productModel(req.body);
    console.log(product)
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.get('/filters', async (req, res) => {
  try {
    const { gender } = req.query;
    const categories = await productModel.find({categoryfor:gender}).distinct('category');
    res.status(200).json({
      categories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Helper function to calculate category preferences
async function calculateCategoryPreferences(userId) {
  const likedProducts = await productModel.find({ 'likes.userId': userId });
  const categoryScores = {};
  
  likedProducts.forEach(product => {
    categoryScores[product.category] = (categoryScores[product.category] || 0) + 1;
  });
  
  return categoryScores;
}

// Helper function to calculate brand preferences
async function calculateBrandPreferences(userId) {
  const likedProducts = await productModel.find({ 'likes.userId': userId });
  const brandScores = {};
  
  likedProducts.forEach(product => {
    brandScores[product.brand] = (brandScores[product.brand] || 0) + 1;
  });
  
  return brandScores;
}

// Helper function to calculate product score
function calculateProductScore(product, categoryPreferences, brandPreferences, userGenderPreference) {
  let score = 0;
  
  // Category match bonus (0-3 points)
  score += (categoryPreferences[product.category] || 0) * 3;
  
  // Brand match bonus (0-2 points)
  score += (brandPreferences[product.brand] || 0) * 2;
  
  // Gender preference bonus (0 or 2 points)
  if (product.gender === userGenderPreference) {
    score += 2;
  }
  
  // Price range normalization (0-1 point)
  const priceScore = product.discountPrice ? 
    (1 - (product.discountPrice / product.price)) : 0;
  score += priceScore;
  
  // Popularity factor based on likes ratio (0-2 points)
  const likesCount = product.likes.length;
  const dislikesCount = product.dislikes.length;
  const totalInteractions = likesCount + dislikesCount;
  
  if (totalInteractions > 0) {
    const popularityScore = (likesCount / totalInteractions) * 2;
    score += popularityScore;
  }
  
  return score;
}

// Helper function to get user's gender preference
async function getUserGenderPreference(userId) {
  const userInteractions = await productModel.find({
    $or: [
      { 'likes.userId': userId },
      { 'dislikes.userId': userId }
    ]
  });

  const genderCounts = userInteractions.reduce((acc, product) => {
    acc[product.gender] = (acc[product.gender] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(genderCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
}

// Helper function to get excluded product IDs
async function getExcludedProductIds(userId) {
  const [likedProducts, dislikedProducts, user] = await Promise.all([
    productModel.find({ 'likes.userId': userId }).select('_id'),
    productModel.find({ 'dislikes.userId': userId }).select('_id'),
    User.findById(userId).select('cart')
  ]);

  return [
    ...likedProducts.map(p => p._id),
    ...dislikedProducts.map(p => p._id),
    ...user.cart.map(item => item.productId)
  ];
}

// Main recommendation route
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { page = 1, limit = 10, gender, category } = req.query;
    const skip = (page - 1) * parseInt(limit);

    // Get user preferences and excluded products in parallel
    const [
      userGenderPreference,
      excludedProductIds,
      categoryPreferences,
      brandPreferences
    ] = await Promise.all([
      getUserGenderPreference(userId),
      getExcludedProductIds(userId),
      calculateCategoryPreferences(userId),
      calculateBrandPreferences(userId)
    ]);

    // Build base query
    const baseQuery = {
      _id: { $nin: excludedProductIds }
    };

    if (gender) baseQuery.gender = gender;
    if (category) {
      baseQuery.category = { 
        $in: Array.isArray(category) ? category : category.split(',') 
      };
    }

    // Get total count for pagination
    const totalCount = await productModel.countDocuments(baseQuery);

    if (totalCount === 0) {
      return res.status(200).json({
        products: [],
        currentPage: Number(page),
        totalPages: 0,
        message: 'No more products available'
      });
    }

    // Get products for current page
    const products = await productModel.find(baseQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Score and sort products
    const scoredProducts = products
      .map(product => ({
        product,
        score: calculateProductScore(
          product,
          categoryPreferences,
          brandPreferences,
          userGenderPreference
        )
      }))
      .sort((a, b) => b.score - a.score);

    res.json({
      products: scoredProducts.map(({ product }) => product),
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
      totalProducts: totalCount
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ 
      message: 'Server Error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});




router.get('/admin', async (req, res) => {
  try {
    const { category, gender, page = 1, limit = 5 } = req.query;
    const query = {};

    // Apply filters if category or gender are provided in the query
    if (category) {
      query.category = category;
    }
    if (gender) {
      query.gender = gender;
    }

    const skip = (page - 1) * limit;

    // Fetch products sorted by createdAt in descending order
    const [products, total] = await Promise.all([
      productModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      productModel.countDocuments(query),
    ]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      products,
      currentPage: Number(page),
      totalPages,
      totalProducts: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await productModel.findByIdAndUpdate(id, req.body, {
      new: true, 
      runValidators: true, 
    });
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await productModel.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/like/:id/', isAuthenticated, async (req, res) => {
  try {
    
    const productId = req.params.id;
    const userId = req.session.userId;

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user has already liked or disliked the product
    const alreadyLiked = product.likes.some((like) => like.userId.equals(userId));
    const alreadyDisliked = product.dislikes.some((dislike) => dislike.userId.equals(userId));

    if (alreadyLiked) {
      // Remove like if already liked
      product.likes = product.likes.filter((like) => !like.userId.equals(userId));
    } else {
      // Add like and remove dislike if present
      product.likes.push({ userId });
      if (alreadyDisliked) {
        product.dislikes = product.dislikes.filter((dislike) => !dislike.userId.equals(userId));
      }
    }

    await product.save();

    return res.status(200).json({ message: 'Like status updated', product });
  } catch (error) {
    console.error('Error liking product:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dislike/:id/', isAuthenticated, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.userId;

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyLiked = product.likes.some((like) => like.userId.equals(userId));
    const alreadyDisliked = product.dislikes.some((dislike) => dislike.userId.equals(userId));

    if (alreadyDisliked) {
      console.log('disliked')
      product.dislikes = product.dislikes.filter((dislike) => !dislike.userId.equals(userId));
    } else {
      product.dislikes.push({ userId });
      if (alreadyLiked) {
        product.likes = product.likes.filter((like) => !like.userId.equals(userId));
      }
    }

    await product.save();

    return res.status(200).json({ message: 'Dislike status updated', product });
  } catch (error) {
    console.error('Error disliking product:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user/Likes', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

    const totalProducts = await productModel.countDocuments({ 'likes.userId': userId });
    
    const totalPages = Math.ceil(totalProducts / limit);

    if (page > totalPages) {
      return res.status(404).json({ message: 'No more liked products available.' });
    }

    const likedProducts = await productModel
      .find({ 'likes.userId': userId })
      .skip((page - 1) * limit) // Skip the previous pages' items
      .limit(limit) // Limit the result to the desired amount

    if (!likedProducts.length) {
      return res.status(404).json({ message: 'No liked products found for this user.' });
    }

    return res.status(200).json({
      products: likedProducts,
      totalPages: totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching liked products:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});




router.get('/add-to-cart/:productId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId; 
    const { productId } = req.params;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const productExistsInCart = user.cart.some((item) => item.productId.equals(productId));
    if (productExistsInCart) {
      return res.status(400).json({ message: 'Product already in cart' });
    }

    user.cart.push({ productId });
    await user.save();

    return res.status(200).json({ message: 'Product added to cart', cart: user.cart });
  } catch (error) {
    console.error('Error adding product to cart:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user/cart', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId).populate({
      path: 'cart.productId', // Path to populate
      model: 'Product', // Model name to populate
      select: 'name price description images productWebsiteLink brand' // Specify which fields to select
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure that user.cart is defined before accessing it
    const cartItems = user.cart || [];

    return res.status(200).json(cartItems); // Return cart items directly
  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/user/clear-cart', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear the cart
    user.cart = [];
    await user.save();

    return res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Clear user's likes
router.delete('/user/clear-likes', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Reset the user's likes
    await productModel.updateMany(
      { 'likes.userId': userId },  // Match products liked by the user
      { $pull: { likes: { userId } } }  // Remove the user's ID from the likes array
    );

    return res.status(200).json({ message: 'User likes cleared successfully' });
  } catch (error) {
    console.error('Error clearing user likes:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


export default router;
