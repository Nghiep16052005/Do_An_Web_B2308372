// Import Model sản phẩm của bạn vào đây (ví dụ mẫu sử dụng Mongoose/MongoDB)
const Product = require('../../models/product.model'); 

// [GET] /admin/products
module.exports.index = async (req, res) => {
  try {
    // Lấy toàn bộ sản phẩm từ Database
    const products = await Product.find({}); 

    // Render giao diện và truyền mảng products sang file Pug
    res.render('admin/pages/products/index', {
      pageTitle: "Danh sách sản phẩm",
      products: products // Biến này sẽ dùng bên file .pug để duyệt vòng lặp
    });
  } catch (error) {
    res.status(500).send("Lỗi kết nối dữ liệu");
  }
};