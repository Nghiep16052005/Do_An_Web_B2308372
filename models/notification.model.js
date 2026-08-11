const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {

        // ======================================
        // Người nhận thông báo
        // ======================================

        user_id: {
            type: String,
            required: true
        },


        // ======================================
        // Đơn hàng liên quan
        // ======================================

        order_id: {
            type: String,
            default: ""
        },


        // ======================================
        // Tiêu đề
        // ======================================

        title: {
            type: String,
            required: true
        },


        // ======================================
        // Nội dung
        // ======================================

        message: {
            type: String,
            required: true
        },


        // ======================================
        // Loại thông báo
        // ======================================

        type: {
            type: String,

            enum: [
                "order_created",
                "payment_pending",
                "payment_paid",
                "payment_failed",
                "order_confirmed",
                "order_cancelled"
            ],

            default: "order_created"
        },


        // ======================================
        // Đã đọc hay chưa
        // ======================================

        isRead: {
            type: Boolean,
            default: false
        }

    },
    {
        timestamps: true
    }
);


const Notification = mongoose.model(
    "Notification",
    notificationSchema,
    "notifications"
);


module.exports = Notification;