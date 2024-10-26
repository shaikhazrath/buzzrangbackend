// routes/reelRoutes.js
import express from 'express';
import Clips from '../models/clipsModel.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Fetch reels with pagination
    const reels = await Clips.find()
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .exec();

    // Count total documents for pagination calculation
    const count = await Clips.countDocuments();

    // Send paginated results
    res.json({
      reels,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reels', error });
  }
});

export default router;
