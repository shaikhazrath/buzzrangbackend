import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  phone: {
    type: Number,
    unique: true,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  verificationCode: {
    type: String,
    required: false
  },
  verificationTimestamp: {
    type: Date,
    required: false, 
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  cart: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product', 
        required: true,
      },
    },
  ],
});

const User = model('User', userSchema);

export default User;
