const express = require("express");
const router = express.Router();

const notificationController = require("../../controllers/client/notification.controller");
const authMiddleware = require("../../middlewares/client/auth.middleware");

router.use(authMiddleware.requireAuth);

router.get("/", notificationController.getNotifications);
router.put("/mark-read", notificationController.markAllAsRead);

module.exports = router;
