const express = require("express");

const router = express.Router();

const borrowRecordController = require("../../controllers/client/borrowRecord.controller");

const authMiddleware = require("../../middlewares/client/auth.middleware");

// Get current reader's borrow records
router.get(
    "/",
    authMiddleware.requireAuth,
    borrowRecordController.getMyBorrowRecords
);

// Borrow a book
router.post(
    "/borrow",
    authMiddleware.requireAuth,
    borrowRecordController.borrowBook
);

// Return a borrowed book
router.put(
    "/:id/return",
    authMiddleware.requireAuth,
    borrowRecordController.returnBook
);

module.exports = router;