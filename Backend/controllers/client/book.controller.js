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


// Search books
module.exports.searchBooks = async (req, res) => {
    try {
        const { keyword } = req.query;

        if (!keyword || keyword.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Search keyword is required."
            });
        }

        const books = await Book.find({
            $or: [
                {
                    title: {
                        $regex: keyword,
                        $options: "i"
                    }
                },
                {
                    author: {
                        $regex: keyword,
                        $options: "i"
                    }
                }
            ]
        }).sort({ title: 1 });

        return res.status(200).json({
            success: true,
            count: books.length,
            data: books
        });
    } catch (error) {
        console.error("Search books error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to search books."
        });
    }
};