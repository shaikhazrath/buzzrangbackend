import { Schema, model } from 'mongoose';

const clipsSchema = new Schema({
  videoURL: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  accountURL: {
    type: String,
    required: true
  },
  productURL: {
    type: String,
    required: false
  }
});

const Clips = model('Clip', clipsSchema);

export default Clips;
