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
        images: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            trim: true,
        },
        categoryfor: {
            type: String,
            enum: ['male', 'female'],
            trim: true,
        },
        brand: {
            type: String,
            trim: true,
        },
        gender: {
            type: String,
            enum: ['male', 'female'], // Allows only 'male' or 'female'
            required: true,
            trim: true,
        },
        discountPrice: {
            type: Number,
            min: 0, // Ensure the discount price is not negative
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
            validate: {
                validator: function (v) {
                    return /^(ftp|http|https):\/\/[^ "]+$/.test(v);
                },
                message: props => `${props.value} is not a valid URL!`
            }
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

productSchema.index({ name: 1, brand: 1, category: 1 }, { unique: true });

export default model('Product', productSchema);
