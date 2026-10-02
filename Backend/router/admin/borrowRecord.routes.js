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

module.exports = router;
