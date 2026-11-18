const express = require("express");
const router = express.Router();

const penaltyController = require("../../controllers/client/penalty.controller");
const authMiddleware = require("../../middlewares/client/auth.middleware");

// Tất cả các route yêu cầu xác thực độc giả
router.use(authMiddleware.requireAuth);

// Lấy danh sách vi phạm & tiền phạt của tôi
router.get("/my-penalties", penaltyController.getMyPenalties);

// Lấy thông tin dự toán mức phạt làm hư/trầy sách trước khi gửi form
router.get("/damage-estimate", penaltyController.getDamageViolationEstimate);

// Form khai báo làm mất sách (Đền bù đúng giá niêm yết trên bìa)
router.post("/report-lost", penaltyController.reportLostBook);

// Form khai báo làm trầy / làm hư sách (Lần 1: 0.25$, Lần 2: 0.50$, Lần 3: 1.50$)
router.post("/report-damaged", penaltyController.reportDamagedBook);

// Nộp / thanh toán tiền phạt
router.put("/:id/pay", penaltyController.payPenalty);

// Độc giả quét mã QR chuyển khoản và xác nhận đã thanh toán
router.post("/:id/confirm-payment", penaltyController.confirmPayment);

// Độc giả thông báo đã tìm lại được sách đã mất
router.post("/notify-found-book", penaltyController.notifyFoundBook);

module.exports = router;
