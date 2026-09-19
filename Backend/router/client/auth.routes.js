const express = require("express");

const router = express.Router();

const authController = require("../../controllers/client/auth.controller");

// ====================
// Client Authentication
// ====================

// Reader login
router.post(
    "/login",
    authController.login
);

// Reader logout
router.post(
    "/logout",
    authController.logout
);

module.exports = router;
