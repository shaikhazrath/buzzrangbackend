import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
        },
        images:
        {
            type: String,
            required: true,
        },
        category: {
            type: String,
        },
        brand: {
            type: String,
        },
        gender: {
            type: String,
            enum: ['male', 'female'], // Allows only 'male' or 'female'
            required: true, // Ensures gender is always provided
            trim: true, // Removes any leading/trailing whitespaces
          },
        discountPrice: {
            type: Number,
        },
        likes: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
            },
        ],
        dislikes: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
            },
        ],
        productWebsiteLink: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

export default model('Product', productSchema);




https://www.snitch.co.in/products/blue-stitchless-polo-t-shirt-4mst2498-04?ref=sbesqxzs&variant=44975274524834