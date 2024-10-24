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
    const categories = await productModel.distinct('category');
    res.status(200).json(categories );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { category, gender, page = 1, limit = 10 } = req.query;
    const query = {};

    const [likedProducts, dislikedProducts] = await Promise.all([
      productModel.find({ 'likes.userId': userId }).select('_id'),
      productModel.find({ 'dislikes.userId': userId }).select('_id')
    ]);

    const user = await User.findById(userId).select('cart');
    const cartProductIds = user.cart.map(item => item.productId);

    const excludedProductIds = [
      ...likedProducts.map(p => p._id),
      ...dislikedProducts.map(p => p._id),
      ...cartProductIds,
    ];

    if (gender) query.gender = gender;
    if (category) query.category = { $in: category.split(',') };

    query._id = { $nin: excludedProductIds };

    const products = await productModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalProducts = await productModel.countDocuments(query);

    res.json({
      products,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});


router.get('/admin', async (req, res) => {
  try {
    const { category, gender, page = 1, limit = 5 } = req.query;
    const query = {};
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      productModel.find(query).skip(skip).limit(Number(limit)),
      productModel.countDocuments(query)
    ]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }
    const totalPages = Math.ceil(total / limit);
    res.status(200).json({
      products,
      currentPage: Number(page),
      totalPages,
      totalProducts: total
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

router.get('/like/:id', isAuthenticated, async (req, res) => {
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
    
    console.log(userId)
    const likedProducts = await productModel.find({ 'likes.userId': userId });
    console.log(likedProducts)

    if (!likedProducts.length) {
      return res.status(404).json({ message: 'No liked products found for this user.' });
    }

    return res.status(200).json(likedProducts);
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
