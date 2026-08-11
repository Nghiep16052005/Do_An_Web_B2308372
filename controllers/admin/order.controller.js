const Order = require("../../models/order.model");
const Notification = require("../../models/notification.model");

// ==========================================
// [GET] /admin/orders
// Danh sách đơn hàng
// ==========================================

module.exports.index = async (req, res) => {

    try {

        const orders = await Order.find({})
            .sort({
                createdAt: -1
            });

        res.render("admin/pages/order/index", {

            pageTitle: "Quản lý đơn hàng",

            orders

        });

    } catch (error) {

        console.error(
            "Lỗi lấy danh sách đơn hàng:",
            error
        );

        res.status(500).send(
            "Có lỗi xảy ra khi lấy danh sách đơn hàng."
        );

    }

};


// ==========================================
// [GET] /admin/orders/detail/:id
// Chi tiết đơn hàng
// ==========================================

module.exports.detail = async (req, res) => {

    try {

        const orderId = req.params.id;

        const order = await Order.findById(orderId);

        if (!order) {

            return res.status(404).send(
                "Không tìm thấy đơn hàng."
            );

        }

        res.render("admin/pages/order/detail", {

            pageTitle: "Chi tiết đơn hàng",

            order,

            success: req.query.success === "1",

            cancelled: req.query.cancelled === "1"

        });

    } catch (error) {

        console.error(
            "Lỗi xem chi tiết đơn hàng:",
            error
        );

        res.status(500).send(
            "Có lỗi xảy ra."
        );

    }

};

// ==========================================
// [POST] /admin/orders/confirm/:id
// Admin xác nhận đã nhận được tiền
// ==========================================

module.exports.confirmPayment = async (req, res) => {

    try {

        const orderId = req.params.id;

        const order = await Order.findById(orderId);

        if (!order) {

            return res.status(404).send(
                "Không tìm thấy đơn hàng."
            );

        }

        // Không cho xác nhận lại đơn đã thanh toán
        if (order.paymentStatus === "paid") {

            return res.redirect(
                `/admin/orders/detail/${order._id}`
            );

        }

        // ======================================
        // CẬP NHẬT TRẠNG THÁI
        // ======================================

        order.paymentStatus = "paid";

        order.orderStatus = "confirmed";

        await order.save();

        // ==========================================
        // THÔNG BÁO THANH TOÁN THÀNH CÔNG
        // ==========================================

        if (order.user_id) {

            await Notification.create({

                user_id: order.user_id,

                order_id: order._id.toString(),

                title: "Thanh toán thành công",

                message:
                    `Đơn hàng #${order._id.toString().slice(-8)} đã được xác nhận thanh toán thành công.`,

                type: "payment_paid",

                isRead: false

            });

        }

        // ==========================================
        // THÔNG BÁO HỦY THANH TOÁN
        // ==========================================


        console.log("=================================");
        console.log("ADMIN ĐÃ XÁC NHẬN THANH TOÁN");
        console.log("Order ID:", order._id);
        console.log("Payment:", order.paymentStatus);
        console.log("Order:", order.orderStatus);
        console.log("=================================");

        return res.redirect(
            `/admin/orders/detail/${order._id}?success=1`
        );

    } catch (error) {

        console.error(
            "Lỗi xác nhận thanh toán:",
            error
        );

        return res.status(500).send(
            "Có lỗi xảy ra khi xác nhận thanh toán."
        );

    }

};


// ==========================================
// [POST] /admin/orders/cancel/:id
// Admin từ chối / hủy thanh toán
// ==========================================

module.exports.cancelPayment = async (req, res) => {

    try {

        const orderId = req.params.id;

        const order = await Order.findById(orderId);

        if (!order) {

            return res.status(404).send(
                "Không tìm thấy đơn hàng."
            );

        }

        // ======================================
        // Nếu đã thanh toán thì không cho hủy
        // ======================================

        if (order.paymentStatus === "paid") {

            return res.status(400).send(
                "Đơn hàng đã được xác nhận thanh toán, không thể hủy."
            );

        }

        // ======================================
        // CẬP NHẬT TRẠNG THÁI
        // ======================================

        order.paymentStatus = "failed";

        order.orderStatus = "cancelled";

        await order.save();
        // ==========================================
        // THÔNG BÁO THANH TOÁN THẤT BẠI
        // ==========================================

        if (order.user_id) {

            await Notification.create({

                user_id: order.user_id,

                order_id: order._id.toString(),

                title: "Thanh toán không thành công",

                message:
                    `Thanh toán của đơn hàng #${order._id.toString().slice(-8)} chưa được xác nhận. Đơn hàng đã bị hủy.`,

                type: "payment_failed",

                isRead: false

            });

        }
        console.log("=================================");
        console.log("ADMIN ĐÃ HỦY THANH TOÁN");
        console.log("Order ID:", order._id);
        console.log("Payment:", order.paymentStatus);
        console.log("Order:", order.orderStatus);
        console.log("=================================");

        return res.redirect(
            `/admin/orders/detail/${order._id}?cancelled=1`
        );

    } catch (error) {

        console.error(
            "Lỗi hủy thanh toán:",
            error
        );

        return res.status(500).send(
            "Có lỗi xảy ra khi hủy thanh toán."
        );

    }

};