import express from 'express';
import FashionNews from '../models/FashionNewsModel.js'; // Update the path based on your file structure

const router = express.Router();

// CREATE: Add a new fashion news article
router.post('/', async (req, res) => {
  const { title, description, image, url } = req.body;

  try {
    const newArticle = new FashionNews({ title, description, image, url });
    await newArticle.save();
    res.status(201).json(newArticle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// READ: Get all fashion news articles
router.get('/', async (req, res) => {
  try {
    const articles = await FashionNews.find();
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ: Get a single fashion news article by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const article = await FashionNews.findById(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE: Update a fashion news article by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, image, url } = req.body;

  try {
    const updatedArticle = await FashionNews.findByIdAndUpdate(
      id,
      { title, description, image, url },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.status(200).json(updatedArticle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Delete a fashion news article by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedArticle = await FashionNews.findByIdAndDelete(id);

    if (!deletedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.status(204).send(); // No content to send back
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
