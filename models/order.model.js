const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {

        // =====================================
        // Người đặt hàng
        // =====================================

        user_id: {
            type: String,
            default: ""
        },


        // =====================================
        // Thông tin người nhận
        // =====================================

        customerInfo: {

            fullName: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                required: true
            },

            address: {
                type: String,
                required: true
            }

        },


        // =====================================
        // Danh sách sản phẩm
        // =====================================

        products: [

            {

                product_id: {
                    type: String,
                    required: true
                },

                name: {
                    type: String,
                    required: true
                },

                thumbnail: {
                    type: String,
                    default: ""
                },

                price: {
                    type: Number,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                total: {
                    type: Number,
                    required: true
                }

            }

        ],


        // =====================================
        // Tổng tiền
        // =====================================

        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },


        // =====================================
        // Phương thức thanh toán
        // =====================================

        paymentMethod: {

            type: String,

            enum: [
                "bank_transfer"
            ],

            default: "bank_transfer"

        },


        // =====================================
        // Trạng thái thanh toán
        // =====================================

        paymentStatus: {

            type: String,

            enum: [
                "pending",
                "paid",
                "failed"
            ],

            default: "pending"

        },


        // =====================================
        // Trạng thái đơn hàng
        // =====================================

        orderStatus: {

            type: String,

            enum: [
                "pending",
                "confirmed",
                "shipping",
                "completed",
                "cancelled"
            ],

            default: "pending"

        },


        // =====================================
        // Nội dung chuyển khoản
        // =====================================

        transferContent: {

            type: String,
            default: ""

        }

    },

    {

        timestamps: true

    }
);


const Order = mongoose.model(
    "Order",
    orderSchema,
    "orders"
);


module.exports = Order;