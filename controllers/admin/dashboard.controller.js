const Order = require("../../models/order.model");

module.exports.index = async (req, res) => {
    try {
        const [totalOrders, paidOrders, pendingOrders, revenueResult, recentOrders] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ paymentStatus: "paid" }),
            Order.countDocuments({ paymentStatus: "pending" }),
            Order.aggregate([
                { $match: { paymentStatus: "paid" } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Order.find({}).sort({ createdAt: -1 }).limit(5)
        ]);

        const totalRevenue = revenueResult[0]?.total || 0;

        res.render("admin/pages/dashboard/index", {
            pageTitle: "Tổng quan admin",
            stats: {
                totalOrders,
                paidOrders,
                pendingOrders,
                totalRevenue
            },
            recentOrders
        });
    } catch (error) {
        console.error("Lỗi lấy dữ liệu dashboard:", error);
        res.status(500).send("Có lỗi xảy ra khi tải dữ liệu tổng quan.");
    }
}