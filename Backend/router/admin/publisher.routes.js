const express = require("express");

const router = express.Router();

const publisherController = require("../../controllers/admin/publisher.controller");
const authMiddleware = require("../../middlewares/admin/auth.middleware");
const validationMiddleware = require("../../middlewares/admin/validation.middleware");

// Get all publishers
router.get(
    "/",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    publisherController.getAllPublishers
);

// Get publisher by ID
router.get(
    "/:id",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    publisherController.getPublisherById
);

// Create publisher
router.post(
    "/",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    validationMiddleware.validatePublisher,
    publisherController.createPublisher
);

// Update publisher
router.put(
    "/:id",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    publisherController.updatePublisher
);

// Delete publisher
router.delete(
    "/:id",
    authMiddleware.requireAuth,
    authMiddleware.requireEmployee,
    publisherController.deletePublisher
);

module.exports = router;