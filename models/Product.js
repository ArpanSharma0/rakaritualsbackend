import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    isBestSeller: {
      type: Boolean,
      required: true,
      default: false,
    },
    isCODAllowed: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Synchronize image and images array
productSchema.pre('save', function (next) {
  if (this.images && this.images.length > 0 && !this.image) {
    this.image = this.images[0];
  } else if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [this.image];
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ isBestSeller: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
