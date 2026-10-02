const express = require("express");
const router = express.Router();

const notificationController = require("../../controllers/admin/notification.controller");
const authMiddleware = require("../../middlewares/admin/auth.middleware");

router.use(authMiddleware.requireAuth);
router.use(authMiddleware.requireEmployee);

router.get("/", notificationController.getNotifications);
router.put("/mark-read", notificationController.markAllAsRead);

module.exports = router;
