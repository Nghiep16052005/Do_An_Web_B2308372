const Notification = require("../../models/notification.model");
const User = require("../../models/user.model");
const Order = require("../../models/order.model");


// ==========================================
// LẤY USER HIỆN TẠI
// ==========================================

async function getCurrentUser(req) {

    if (!req.cookies.tokenUser) {
        return null;
    }

    const user = await User.findOne({

        token: req.cookies.tokenUser,

        deleted: false

    });

    return user;
}


// ==========================================
// GET /notifications
// Danh sách thông báo
// ==========================================

module.exports.index = async (req, res) => {

    try {

        const user = await getCurrentUser(req);

        if (!user) {

            return res.redirect("/account/login");

        }

        const notifications =
            await Notification.find({

                user_id: user._id.toString()

            })
            .sort({
                createdAt: -1
            });


        const unreadCount =
            await Notification.countDocuments({

                user_id: user._id.toString(),

                isRead: false

            });


        res.render(
            "client/pages/notification/index",
            {

                pageTitle: "Thông báo",

                notifications,

                unreadCount

            }
        );


    } catch (error) {

        console.error(
            "Lỗi lấy thông báo:",
            error
        );

        res.status(500).send(
            "Có lỗi xảy ra."
        );

    }

}; 

// ==========================================
// POST /notifications/read/:id
// Đánh dấu đã đọc
// ==========================================

module.exports.markRead = async (req, res) => {

    try {

        const user = await getCurrentUser(req);

        if (!user) {

            return res.status(401).json({

                success: false,

                message: "Chưa đăng nhập"

            });

        }


        const notification =
            await Notification.findOne({

                _id: req.params.id,

                user_id: user._id.toString()

            });


        if (!notification) {

            return res.status(404).json({

                success: false,

                message: "Không tìm thấy thông báo"

            });

        }


        notification.isRead = true;

        await notification.save();


        return res.json({

            success: true,

            message: "Đã đánh dấu đã đọc"

        });


    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Có lỗi xảy ra"

        });

    }

};

// ==========================================
// GET /notifications/unread-count
// ==========================================

module.exports.unreadCount = async (req, res) => {

    try {

        const user = await getCurrentUser(req);

        if (!user) {

            return res.json({

                success: true,

                count: 0

            });

        }


        const count =
            await Notification.countDocuments({

                user_id: user._id.toString(),

                isRead: false

            });


        return res.json({

            success: true,

            count

        });


    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            count: 0

        });

    }

};

// ==========================================
// GET /notifications/detail/:id
// Trang chi tiết thông báo / theo dõi đơn hàng
// ==========================================

module.exports.detail = async (req, res) => {

    try {

        const user = await getCurrentUser(req);

        if (!user) {

            return res.redirect("/account/login");

        }

        const notification = await Notification.findOne({

            _id: req.params.id,

            user_id: user._id.toString()

        });

        if (!notification) {

            return res.status(404).render(
                "client/pages/notification/detail",
                {
                    pageTitle: "Không tìm thấy thông báo",
                    notification: null,
                    order: null,
                    user: user,
                    status: null,
                    paymentStatusLabel: "",
                    orderStatusLabel: ""
                }
            );

        }

        const order = notification.order_id
            ? await Order.findById(notification.order_id)
            : null;

        const paymentStatusLabel = {
            pending: "Chờ thanh toán",
            paid: "Đã thanh toán",
            failed: "Thanh toán thất bại"
        }[order?.paymentStatus || "pending"] || "Chờ thanh toán";

        const orderStatusLabel = {
            pending: "Đang chờ xác nhận",
            confirmed: "Đã xác nhận",
            shipping: "Đang giao hàng",
            completed: "Hoàn thành",
            cancelled: "Đã hủy"
        }[order?.orderStatus || "pending"] || "Đang chờ xác nhận";

        if (!notification.isRead) {

            notification.isRead = true;
            await notification.save();

        }

        return res.render(
            "client/pages/notification/detail",
            {
                pageTitle: "Theo dõi đơn hàng",
                notification,
                order,
                user,
                status: {
                    paymentStatusLabel,
                    orderStatusLabel
                },
                paymentStatusLabel,
                orderStatusLabel
            }
        );

    } catch (error) {

        console.error("Lỗi trang chi tiết thông báo:", error);

        return res.status(500).send("Có lỗi xảy ra.");

    }

};