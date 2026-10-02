const express = require("express");

const router = express.Router();

const authRoutes = require("./auth.routes");
const bookRoutes = require("./book.routes");
const publisherRoutes = require("./publisher.routes");
const readerRoutes = require("./reader.routes");
const borrowRecordRoutes = require("./borrowRecord.routes");
const notificationRoutes = require("./notification.routes");

router.use("/auth", authRoutes);
router.use("/books", bookRoutes);
router.use("/publishers", publisherRoutes);
router.use("/readers", readerRoutes);
router.use("/borrow-records", borrowRecordRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;