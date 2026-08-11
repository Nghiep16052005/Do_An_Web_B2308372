const QRCode = require("qrcode");
const Order = require("../../models/order.model");
const User = require("../../models/user.model");


// ==========================================
// GET /payment/:orderId
// Hiển thị trang thanh toán
// ==========================================

module.exports.index = async (req, res) => {

    try {

        const orderId = req.params.orderId;


        // ==========================================
        // 1. TÌM ĐƠN HÀNG
        // ==========================================

        const order = await Order.findById(orderId);

        if (!order) {

            return res.status(404).send(
                "Không tìm thấy đơn hàng"
            );

        }


        // ==========================================
        // 2. NẾU ĐÃ THANH TOÁN
        // ==========================================

        if (order.paymentStatus === "paid") {

            return res.redirect("/");

        }


        // ==========================================
        // 3. LẤY USER ĐANG ĐĂNG NHẬP
        // ==========================================

        let user = null;

        if (req.cookies.tokenUser) {

            user = await User.findOne({

                token: req.cookies.tokenUser,

                deleted: false

            });

        }


        // ==========================================
        // 4. TÊN KHÁCH HÀNG
        // ==========================================

        let customerName = "KHACHHANG";

        if (user && user.fullName) {

            customerName = user.fullName

                .normalize("NFD")

                .replace(/[\u0300-\u036f]/g, "")

                .replace(/[^a-zA-Z0-9]/g, "")

                .toUpperCase();

        }
        else if (order.customerInfo?.fullName) {

            customerName = order.customerInfo.fullName

                .normalize("NFD")

                .replace(/[\u0300-\u036f]/g, "")

                .replace(/[^a-zA-Z0-9]/g, "")

                .toUpperCase();

        }


        // ==========================================
        // 5. LẤY NỘI DUNG CHUYỂN KHOẢN
        // ==========================================
        //
        // QUAN TRỌNG:
        // Không tạo mã mới ở đây.
        // Lấy đúng mã đã lưu trong Order.
        //

        const transferContent =
            order.transferContent;


        // ==========================================
        // 6. THÔNG TIN NGÂN HÀNG
        // ==========================================

        const bankName = "Vietcombank";

        const accountNumber = "0123456789";

        const accountName = "LAPTOP STORE";

        const amount = Number(order.totalPrice || 0);


        // ==========================================
        // 7. DỮ LIỆU QR
        // ==========================================
        //
        // Đây là QR mô phỏng cho hệ thống của bạn.
        // QR chứa:
        // - Ngân hàng
        // - Số tài khoản
        // - Chủ tài khoản
        // - Số tiền
        // - Nội dung chuyển khoản
        // - Mã đơn hàng
        // - Khách hàng
        //

        const qrData = JSON.stringify({

            bank: bankName,

            accountNumber: accountNumber,

            accountName: accountName,

            amount: amount,

            content: transferContent,

            orderId: order._id.toString(),

            customer: customerName

        });


        // ==========================================
        // 8. TẠO QR
        // ==========================================

        const qrCode = await QRCode.toDataURL(

            qrData,

            {

                width: 350,

                margin: 2,

                errorCorrectionLevel: "M"

            }

        );


        // ==========================================
        // 9. RENDER
        // ==========================================

        return res.render(

            "client/pages/payment/index",

            {

                pageTitle: "Thanh toán",

                order: order,

                customerName: customerName,

                transferContent: transferContent,

                bankName: bankName,

                accountNumber: accountNumber,

                accountName: accountName,

                amount: amount,

                qrCode: qrCode

            }

        );


    }
    catch (error) {

        console.error(
            "Payment error:",
            error
        );

        return res.status(500).send(

            "Có lỗi xảy ra trong quá trình thanh toán"

        );

    }

};



// ==========================================
// POST /payment/:orderId/confirm
// Người dùng báo đã chuyển khoản
// ==========================================

module.exports.confirm = async (req, res) => {

    try {

        const orderId = req.params.orderId;


        // ==========================================
        // 1. TÌM ORDER
        // ==========================================

        const order = await Order.findById(orderId);

        if (!order) {

            return res.status(404).send(

                "Không tìm thấy đơn hàng"

            );

        }


        // ==========================================
        // 2. ĐÃ THANH TOÁN
        // ==========================================

        if (order.paymentStatus === "paid") {

            return res.redirect("/");

        }


        // ==========================================
        // 3. NGƯỜI DÙNG BÁO ĐÃ CHUYỂN KHOẢN
        // ==========================================

        order.paymentStatus = "pending";

        order.orderStatus = "pending";


        await order.save();


        // ==========================================
        // 4. QUAY LẠI TRANG PAYMENT
        // ==========================================

        return res.redirect(

            `/payment/${order._id}?submitted=1`

        );

    }
    catch (error) {

        console.error(

            "Confirm payment error:",

            error

        );

        return res.status(500).send(

            "Có lỗi xảy ra khi xác nhận thanh toán"

        );

    }

};