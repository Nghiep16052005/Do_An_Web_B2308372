const express = require("express");

const router = express.Router();

const readerController = require("../../controllers/client/reader.controller");
const authMiddleware = require("../../middlewares/client/auth.middleware");

router.get(
    "/profile",
    authMiddleware.requireAuth,
    readerController.getProfile
);

// Update current reader profile
router.put(
    "/profile",
    authMiddleware.requireAuth,
    readerController.updateProfile
);

module.exports = router;