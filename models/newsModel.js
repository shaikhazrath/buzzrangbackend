import mongoose from 'mongoose';

const fashionNewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  publicationDate: {
    type: Date,
    required: true,
    default: Date.now,
  },  url: {
    type: String,
  },
});

const FashionNews = mongoose.model('FashionNews', fashionNewsSchema);

export default FashionNews;
