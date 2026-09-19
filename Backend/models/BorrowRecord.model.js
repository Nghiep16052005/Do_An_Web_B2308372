const mongoose = require("mongoose");

const borrowRecordSchema = new mongoose.Schema(
    {
        readerId: {
            type: String,
            required: true,
            trim: true
        },

        bookId: {
            type: String,
            required: true,
            trim: true
        },

        employeeId: {
            type: String,
            required: true,
            trim: true
        },

        borrowDate: {
            type: Date,
            required: true,
            default: Date.now
        },

        dueDate: {
            type: Date,
            required: true
        },

        returnDate: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["Borrowing", "Returned", "Overdue"],
            default: "Borrowing"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "BorrowRecord",
    borrowRecordSchema
);