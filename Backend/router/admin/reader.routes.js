const express = require("express");

const router = express.Router();

const readerController = require("../../controllers/admin/reader.controller");

const authMiddleware = require("../../middlewares/admin/auth.middleware");

// Get all readers
router.get(
    "/",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    readerController.getAllReaders
);

// Get reader by ID
router.get(
    "/:id",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    readerController.getReaderById
);

// Create reader
router.post(
    "/",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    readerController.createReader
);

// Update reader
router.put(
    "/:id",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    readerController.updateReader
);

// Delete reader
router.delete(
    "/:id",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    readerController.deleteReader
);

module.exports = router;