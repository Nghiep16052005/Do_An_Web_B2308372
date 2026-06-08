// lấy thư viện express để sử dụng
const express = require("express");
// tạo một router riếng cho products 
const router = express.Router();
// lấy file controller để sử dụng
const controller = require("../../controllers/client/products.controllers");

// /products
router.get("/", controller.index);
// cho phép các file khác sử dụng router này
module.exports = router; 