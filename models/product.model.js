const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
{
  name: String,

  slug: String,

  manufacturer: {
    name: String
  },

  category: String,

  priceIn: Number,

  priceOut: Number,

  salePrice: Number,

  stock: Number,

  sold: Number,

  status: String,

  thumbnail: String,

  images: [String],

  specifications: {
    cpu: {
      brand: String,
      model: String
    },

    ram: {
      size: Number,
      type_: String
    },

    gpu: {
      brand: String,
      model: String
    },

    storage: {
      type_: String,
      capacity: String
    },

    display: {
      size: String,
      refreshRate: String
    },

    os: String
  },

  description: String,

  ratingAverage: Number,

  reviewCount: Number
},
{
  timestamps: true
});

const Product = mongoose.model("Product", productSchema, "products");

module.exports = Product;