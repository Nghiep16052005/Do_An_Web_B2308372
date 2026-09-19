const express = require("express");

const router = express.Router();

const bookController = require("../../controllers/client/book.controller");

// Get all books
router.get(
    "/",
    bookController.getAllBooks
);

// Search books
router.get(
    "/search",
    bookController.searchBooks
);

// Get book by ID
router.get(
    "/:id",
    bookController.getBookById
);

module.exports = router;