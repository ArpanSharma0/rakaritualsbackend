import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB cluster.");

    const product = await Product.findById("6a0b08f4eb0f10486f4b882b");
    if (!product) {
      console.log("Product not found in database.");
    } else {
      console.log("Product Document:");
      console.log(JSON.stringify(product, null, 2));
    }
  } catch (err) {
    console.error("Error during query:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

run();
