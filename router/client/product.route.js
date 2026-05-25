const express = require("express");
const router = express.Router();
const products = require("../../controllers/client/products.controllers")
router.get('/', products.index );
router.post('/', products.index );

module.exports = router;