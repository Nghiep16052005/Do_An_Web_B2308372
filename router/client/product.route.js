const express = require("express");

const router = express.Router();

const controller = require("../../controllers/client/products.controllers");

// /products
router.get("/", controller.index);

module.exports = router;