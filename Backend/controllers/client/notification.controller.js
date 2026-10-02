const Notification = require("../../models/Notification.model");

module.exports.getNotifications = async (req, res) => {
    try {
        const readerId = req.user.readerId;

        const notifications = await Notification.find({
            target: "READER",
            readerId: readerId
        })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        const unreadCount = await Notification.countDocuments({
            target: "READER",
            readerId: readerId,
            isRead: false
        });

        return res.status(200).json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        console.error("Reader get notifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve notifications."
        });
    }
};

module.exports.markAllAsRead = async (req, res) => {
    try {
        const readerId = req.user.readerId;

        await Notification.updateMany(
            { target: "READER", readerId: readerId, isRead: false },
            { isRead: true }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read."
        });
    } catch (error) {
        console.error("Reader mark notifications read error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read."
        });
    }
};
