const Publisher = require("../../models/Publisher.model");

// Get all publishers
module.exports.getAllPublishers = async (req, res) => {
    try {
        const publishers = await Publisher.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: publishers.length,
            data: publishers
        });
    } catch (error) {
        console.error("Get all publishers error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve publishers."
        });
    }
};

// Get publisher by ID
module.exports.getPublisherById = async (req, res) => {
    try {
        const { id } = req.params;

        const publisher = await Publisher.findOne({
            publisherId: id
        });

        if (!publisher) {
            return res.status(404).json({
                success: false,
                message: "Publisher not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: publisher
        });
    } catch (error) {
        console.error("Get publisher by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve the publisher."
        });
    }
};

// Create publisher
module.exports.createPublisher = async (req, res) => {
    try {
        const {
            publisherId,
            name,
            address,
            phoneNumber,
            email
        } = req.body;

        const existingPublisher = await Publisher.findOne({
            publisherId: publisherId
        });

        if (existingPublisher) {
            return res.status(409).json({
                success: false,
                message: "Publisher ID already exists."
            });
        }

        const publisher = new Publisher({
            publisherId,
            name,
            address,
            phoneNumber,
            email
        });

        await publisher.save();

        return res.status(201).json({
            success: true,
            message: "Publisher created successfully.",
            data: publisher
        });
    } catch (error) {
        console.error("Create publisher error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create the publisher."
        });
    }
};

// Update publisher
module.exports.updatePublisher = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            address,
            phoneNumber,
            email
        } = req.body;

        const publisher = await Publisher.findOne({
            publisherId: id
        });

        if (!publisher) {
            return res.status(404).json({
                success: false,
                message: "Publisher not found."
            });
        }

        if (name !== undefined) {
            publisher.name = name;
        }

        if (address !== undefined) {
            publisher.address = address;
        }

        if (phoneNumber !== undefined) {
            publisher.phoneNumber = phoneNumber;
        }

        if (email !== undefined) {
            publisher.email = email;
        }

        await publisher.save();

        return res.status(200).json({
            success: true,
            message: "Publisher updated successfully.",
            data: publisher
        });
    } catch (error) {
        console.error("Update publisher error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update the publisher."
        });
    }
};

// Delete publisher
module.exports.deletePublisher = async (req, res) => {
    try {
        const { id } = req.params;

        const publisher = await Publisher.findOne({
            publisherId: id
        });

        if (!publisher) {
            return res.status(404).json({
                success: false,
                message: "Publisher not found."
            });
        }

        await Publisher.deleteOne({
            publisherId: id
        });

        return res.status(200).json({
            success: true,
            message: "Publisher deleted successfully."
        });
    } catch (error) {
        console.error("Delete publisher error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete the publisher."
        });
    }
};