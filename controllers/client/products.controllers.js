const Product = require("../../models/product.model");

// [GET] /products
module.exports.index = async (req, res) => {

  // lấy toàn bộ sản phẩm
  const products = await Product.find({});

  // render pug
  res.render("client/pages/products/index", {
    pageTitle: "Danh sách sản phẩm",
    products: products
  });
}