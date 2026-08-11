const express = require("express");

const router = express.Router();

const controller = require("../../controllers/admin/order.controller");


// ==========================================
// GET /admin/orders
// Danh sách đơn hàng
// ==========================================

router.get(
    "/",
    controller.index
);


// ==========================================
// GET /admin/orders/detail/:id
// Chi tiết đơn hàng
// ==========================================

router.get(
    "/detail/:id",
    controller.detail
);


// ==========================================
// POST /admin/orders/confirm/:id
// Admin xác nhận thanh toán
// ==========================================

router.post(
    "/confirm/:id",
    controller.confirmPayment
);


// ==========================================
// POST /admin/orders/cancel/:id
// Admin hủy thanh toán
// ==========================================

router.post(
    "/cancel/:id",
    controller.cancelPayment
);


module.exports = router;