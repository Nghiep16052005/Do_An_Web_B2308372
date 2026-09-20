const Book = require("../../models/Book.model");

// Get all books
module.exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: books.length,
            data: books
        });
    } catch (error) {
        console.error("Get all books error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve books."
        });
    }
};

// Get book by ID
module.exports.getBookById = async (req, res) => {
    try {
        const { id } = req.params;

        const book = await Book.findOne({
            bookId: id
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: book
        });
    } catch (error) {
        console.error("Get book by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve the book."
        });
    }
};

// Create a new book
module.exports.createBook = async (req, res) => {
    try {
        const {
            bookId,
            title,
            author,
            publisherId,
            publicationYear,
            price,
            quantity,
            image
        } = req.body;

        // Check whether the book already exists
        const existingBook = await Book.findOne({
            bookId: bookId
        });

        if (existingBook) {
            return res.status(409).json({
                success: false,
                message: "Book ID already exists."
            });
        }

        // Create book
        const book = new Book({
            bookId,
            title,
            author,
            publisherId,
            publicationYear,
            price,
            quantity,
            ...(image ? { image } : {})
        });

        await book.save();

        return res.status(201).json({
            success: true,
            message: "Book created successfully.",
            data: book
        });
    } catch (error) {
        console.error("Create book error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create the book."
        });
    }
};

// Update a book
module.exports.updateBook = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            author,
            publisherId,
            publicationYear,
            price,
            quantity,
            image
        } = req.body;

        const book = await Book.findOne({
            bookId: id
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        if (title !== undefined) {
            book.title = title;
        }

        if (author !== undefined) {
            book.author = author;
        }

        if (publisherId !== undefined) {
            book.publisherId = publisherId;
        }

        if (publicationYear !== undefined) {
            book.publicationYear = publicationYear;
        }

        if (price !== undefined) {
            book.price = price;
        }

        if (quantity !== undefined) {
            book.quantity = quantity;
        }

        if (image !== undefined) {
            book.image = image;
        }

        await book.save();

        return res.status(200).json({
            success: true,
            message: "Book updated successfully.",
            data: book
        });
    } catch (error) {
        console.error("Update book error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update the book."
        });
    }
};

// Delete a book
module.exports.deleteBook = async (req, res) => {
    try {
        const { id } = req.params;

        const book = await Book.findOne({
            bookId: id
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        await Book.deleteOne({
            bookId: id
        });

        return res.status(200).json({
            success: true,
            message: "Book deleted successfully."
        });
    } catch (error) {
        console.error("Delete book error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete the book."
        });
    }
};