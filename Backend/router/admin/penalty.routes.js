const express = require("express");
const router = express.Router();

const penaltyController = require("../../controllers/admin/penalty.controller");
const authMiddleware = require("../../middlewares/admin/auth.middleware");

router.use(authMiddleware.requireAuth);

// Lấy danh sách tất cả biên bản phạt
router.get("/", penaltyController.getAllPenalties);

// Lập biên bản phạt mới
router.post("/", penaltyController.createPenalty);

// Cập nhật trạng thái phiếu phạt (Paid, Pending, Waived)
router.put("/:id/status", penaltyController.updatePenaltyStatus);

// Duyệt thanh toán chuyển khoản qua mã QR
router.put("/:id/approve-payment", penaltyController.approvePayment);

// Từ chối xác nhận thanh toán
router.put("/:id/reject-payment", penaltyController.rejectPayment);

// Tình huống 2: Tiếp nhận sách đã từng báo mất nay độc giả tìm lại được và hoàn trả
router.post("/return-found-book", penaltyController.returnFoundBook);

module.exports = router;
