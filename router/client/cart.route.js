const express = require("express");

const router = express.Router();

const controller = require("../../controllers/client/cart.controller");


// ==============================
// Hiển thị giỏ hàng
// ==============================

// GET /cart
router.get(
    "/",
    controller.index
);


// ==============================
// Thêm sản phẩm vào giỏ hàng
// ==============================

// POST /cart/add/:productId
router.post(
    "/add/:productId",
    controller.addPost
);
// ==============================
// Cập nhật số lượng
// ==============================

// PATCH /cart/update/:productId/:quantity
router.patch(
    "/update/:productId/:quantity",
    controller.update
);


// ==============================
// Xóa sản phẩm
// ==============================

// DELETE /cart/delete/:productId
router.delete(
    "/delete/:productId",
    controller.delete
);


module.exports = router;