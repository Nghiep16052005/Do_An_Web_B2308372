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
            enum: ["Borrowing", "Returned", "Overdue", "ReturnPending", "Lost", "FoundReturned"],
            default: "Borrowing"
        },

        // Tình trạng thực tế khi nhân viên kiểm tra nhận lại sách tại quầy
        actualCondition: {
            type: String,
            enum: ["Normal", "LightDamage", "MediumDamage", "HeavyDamage", "Unrecoverable", "Lost"],
            default: "Normal"
        },

        // Ghi chú chi tiết về tình trạng sách lúc tiếp nhận
        conditionNote: {
            type: String,
            default: "",
            trim: true
        },

        // Mã nhân viên thư viện trực tiếp tiếp nhận và kiểm tra sách
        receivedByEmployeeId: {
            type: String,
            default: "",
            trim: true
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