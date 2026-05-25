const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/dashbroad.controller');
const { model } = require('mongoose');
router.get("/", dashboardController.dashboard);
module.exports = router;
