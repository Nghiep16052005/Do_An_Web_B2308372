const express = require("express");

const router = express.Router();

const controller =
    require("../../controllers/client/notification.controller");


// ==========================================
// Danh sách thông báo
// ==========================================

router.get(
    "/",
    controller.index
);


// ==========================================
// Đánh dấu đã đọc
// ==========================================

router.post(
    "/read/:id",
    controller.markRead
);


// ==========================================
// Số lượng chưa đọc
// ==========================================

router.get(
    "/unread-count",
    controller.unreadCount
);


module.exports = router;