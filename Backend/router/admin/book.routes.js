const express = require("express");

const router = express.Router();

const bookController = require("../../controllers/admin/book.controller");
const authMiddleware = require("../../middlewares/admin/auth.middleware");
const validationMiddleware = require("../../middlewares/admin/validation.middleware");

// Get all books
router.get(
    "/",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    bookController.getAllBooks
);

// Get book by ID
router.get(
    "/:id",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    bookController.getBookById
);

// Create a new book
router.post(
    "/",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    validationMiddleware.validateBook,
    bookController.createBook
);

// Update a book
router.put(
    "/:id",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    bookController.updateBook
);

// Delete a book
router.delete(
    "/:id",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    bookController.deleteBook
);

module.exports = router;