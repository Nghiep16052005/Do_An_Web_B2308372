const express = require("express");

const router = express.Router();

const controller = require("../../controllers/client/checkout.controller");

// GET /checkout
router.get(
    "/",
    controller.index
);

// POST /checkout
router.post(
    "/",
    controller.orderPost
);

module.exports = router;