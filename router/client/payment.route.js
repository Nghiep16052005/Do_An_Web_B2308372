const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/payment.controller");

// [GET] /payment/:orderId
router.get("/:orderId", controller.index);

// [POST] /payment/:orderId/confirm
router.post("/:orderId/confirm", controller.confirm);

module.exports = router;