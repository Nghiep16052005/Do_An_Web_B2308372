const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        target: {
            type: String,
            enum: ["ADMIN", "READER"],
            required: true
        },
        readerId: {
            type: String,
            default: null,
            trim: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ["BORROW", "RETURN", "SYSTEM"],
            default: "SYSTEM"
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Notification", notificationSchema);
