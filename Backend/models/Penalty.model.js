const mongoose = require("mongoose");

const penaltySchema = new mongoose.Schema(
    {
        penaltyId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
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
        borrowRecordId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BorrowRecord",
            default: null
        },
        type: {
            type: String,
            enum: ["OVERDUE", "LOST", "DAMAGED"],
            required: true
        },
        occurrence: {
            type: Number,
            default: 1
        },
        reason: {
            type: String,
            required: true,
            trim: true
        },
        fineAmount: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: ["Pending", "PaymentPending", "Paid", "Waived", "Cancelled", "Adjusted"],
            default: "Pending"
        },
        paymentMethod: {
            type: String,
            enum: ["QR_BANK", "CASH", "NONE"],
            default: "NONE"
        },
        paymentNote: {
            type: String,
            default: "",
            trim: true
        },
        paymentSubmittedAt: {
            type: Date,
            default: null
        },
        severity: {
            type: String,
            enum: ["NONE", "LIGHT", "MEDIUM", "HEAVY", "UNRECOVERABLE"],
            default: "NONE"
        },
        cancellationReason: {
            type: String,
            default: "",
            trim: true
        },
        handledByEmployeeId: {
            type: String,
            default: "",
            trim: true
        },
        paidAt: {
            type: Date,
            default: null
        },
        paymentDeadline: {
            type: Date,
            default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Hạn chót thanh toán: 3 ngày
        },
        reportedBy: {
            type: String,
            enum: ["READER", "ADMIN", "SYSTEM"],
            default: "SYSTEM"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Penalty", penaltySchema);
