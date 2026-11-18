const express = require("express");

const router = express.Router();

const authRoutes = require("./auth.routes");
const bookRoutes = require("./book.routes");
const readerRoutes = require("./reader.routes");
const borrowRecordRoutes = require("./borrowRecord.routes");
const notificationRoutes = require("./notification.routes");
const penaltyRoutes = require("./penalty.routes");

// ====================
// Client Routes
// ====================

router.use("/auth", authRoutes);
router.use("/books", bookRoutes);
router.use("/readers", readerRoutes);
router.use("/borrow-records", borrowRecordRoutes);
router.use("/notifications", notificationRoutes);
router.use("/penalties", penaltyRoutes);

module.exports = router;
