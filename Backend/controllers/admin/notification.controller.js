const Notification = require("../../models/Notification.model");

module.exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ target: "ADMIN" })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        const unreadCount = await Notification.countDocuments({
            target: "ADMIN",
            isRead: false
        });

        return res.status(200).json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        console.error("Admin get notifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve notifications."
        });
    }
};

module.exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { target: "ADMIN", isRead: false },
            { isRead: true }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read."
        });
    } catch (error) {
        console.error("Admin mark notifications read error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read."
        });
    }
};
