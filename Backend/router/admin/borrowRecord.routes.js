const express = require("express");
const router = express.Router();

const borrowRecordController = require("../../controllers/admin/borrowRecord.controller");
const authMiddleware = require("../../middlewares/admin/auth.middleware");

// All routes require Employee authentication
router.use(authMiddleware.requireAuth);
router.use(authMiddleware.requireEmployee);

// Get all borrow records
router.get("/", borrowRecordController.getAllBorrowRecords);

// Get single borrow record
router.get("/:id", borrowRecordController.getBorrowRecordById);

// Update status
router.put("/:id/status", borrowRecordController.updateStatus);

// Tình huống 1: Nhân viên tiếp nhận & kiểm tra thực tế sách tại quầy
router.post("/:id/inspect-return", borrowRecordController.inspectAndReturn);

// Tình huống 3: Admin xác minh mất sách do quá hạn kéo dài
router.post("/:id/confirm-lost", borrowRecordController.confirmLostByAdmin);

module.exports = router;
