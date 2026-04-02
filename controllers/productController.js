import Product from '../models/Product.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  const pageSize = 8;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const count = await Product.countDocuments({ ...keyword });
  const products = await Product.find({ ...keyword })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
};

// @desc    Fetch best seller products
// @route   GET /api/products/best
// @access  Public
const getBestProducts = async (req, res) => {
  const products = await Product.find({ isBestSeller: true });
  res.json(products);
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  const { name, price, description, images, image, category, countInStock, isBestSeller } = req.body;

  const product = new Product({
    name,
    price,
    user: req.user._id,
    images: images || (image ? [image] : []),
    image: image || (images && images.length > 0 ? images[0] : ''),
    category,
    countInStock,
    description,
    isBestSeller,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const { name, price, description, images, image, category, countInStock, isBestSeller } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    
    // Update images array and single image field
    if (images) {
      product.images = images;
      product.image = images[0] || product.image;
    } else if (image) {
      product.image = image;
      product.images = [image];
    }

    product.category = category || product.category;
    product.countInStock = countInStock || product.countInStock;
    product.isBestSeller = isBestSeller !== undefined ? isBestSeller : product.isBestSeller;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
};

export {
  getProducts,
  getProductById,
  getBestProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
