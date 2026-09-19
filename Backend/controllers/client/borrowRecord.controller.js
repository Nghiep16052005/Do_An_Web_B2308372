const BorrowRecord = require("../../models/BorrowRecord.model");
const Book = require("../../models/Book.model");
const Reader = require("../../models/Reader.model");


// Get current reader's borrow records
module.exports.getMyBorrowRecords = async (req, res) => {
    try {
        const readerId = req.user.readerId;

        const borrowRecords = await BorrowRecord.find({
            readerId: readerId
        }).sort({ borrowDate: -1 });

        return res.status(200).json({
            success: true,
            count: borrowRecords.length,
            data: borrowRecords
        });
    } catch (error) {
        console.error("Get borrow records error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve borrow records."
        });
    }
};


// Borrow a book
module.exports.borrowBook = async (req, res) => {
    try {
        const readerId = req.user.readerId;
        const { bookId, dueDate } = req.body;

        // Check reader
        const reader = await Reader.findOne({
            readerId: readerId
        });

        if (!reader) {
            return res.status(404).json({
                success: false,
                message: "Reader not found."
            });
        }

        // Check reader status
        if (reader.status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Reader account is inactive."
            });
        }

        // Check book
        const book = await Book.findOne({
            bookId: bookId
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        // Check book availability
        if (book.quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Book is currently unavailable."
            });
        }

        // Check whether the reader is already borrowing this book
        const existingBorrowRecord = await BorrowRecord.findOne({
            readerId: readerId,
            bookId: bookId,
            status: "Borrowing"
        });

        if (existingBorrowRecord) {
            return res.status(400).json({
                success: false,
                message: "You are already borrowing this book."
            });
        }

        // Create borrow record
        const borrowRecord = new BorrowRecord({
            readerId: readerId,
            bookId: bookId,
            employeeId: "SYSTEM",
            borrowDate: new Date(),
            dueDate: dueDate,
            status: "Borrowing"
        });

        await borrowRecord.save();

        // Decrease available quantity
        book.quantity -= 1;

        await book.save();

        return res.status(201).json({
            success: true,
            message: "Book borrowed successfully.",
            data: borrowRecord
        });
    } catch (error) {
        console.error("Borrow book error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to borrow the book."
        });
    }
};


// Return a borrowed book
module.exports.returnBook = async (req, res) => {
    try {
        const readerId = req.user.readerId;
        const { id } = req.params;

        // Find borrow record
        const borrowRecord = await BorrowRecord.findOne({
            _id: id,
            readerId: readerId,
            status: "Borrowing"
        });

        if (!borrowRecord) {
            return res.status(404).json({
                success: false,
                message: "Active borrow record not found."
            });
        }

        // Find book
        const book = await Book.findOne({
            bookId: borrowRecord.bookId
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book associated with this record was not found."
            });
        }

        // Update borrow record
        borrowRecord.returnDate = new Date();
        borrowRecord.status = "Returned";

        await borrowRecord.save();

        // Increase available quantity
        book.quantity += 1;

        await book.save();

        return res.status(200).json({
            success: true,
            message: "Book returned successfully.",
            data: borrowRecord
        });
    } catch (error) {
        console.error("Return book error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to return the book."
        });
    }
};
