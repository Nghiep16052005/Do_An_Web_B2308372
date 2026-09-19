const express = require("express");

const router = express.Router();

const authController = require("../../controllers/admin/auth.controller");

// Employee login
router.post(
    "/login",
    authController.login
);

// Employee logout
router.post(
    "/logout",
    authController.logout
);

module.exports = router;