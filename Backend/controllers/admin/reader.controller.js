const Reader = require("../../models/Reader.model");

// GET /admin/readers
module.exports.getAllReaders = async (req, res) => {
    try {
        const readers = await Reader.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Get all readers successfully",
            data: readers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get readers",
            error: error.message
        });
    }
};

// GET /admin/readers/:id
module.exports.getReaderById = async (req, res) => {
    try {
        const reader = await Reader.findOne({
            readerId: req.params.id
        });

        if (!reader) {
            return res.status(404).json({
                success: false,
                message: "Reader not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Get reader successfully",
            data: reader
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get reader",
            error: error.message
        });
    }
};

// POST /admin/readers
module.exports.createReader = async (req, res) => {
    try {
        const {
            readerId,
            fullName,
            dateOfBirth,
            gender,
            address,
            phoneNumber,
            email
        } = req.body;

        const existingReader = await Reader.findOne({ readerId });

        if (existingReader) {
            return res.status(409).json({
                success: false,
                message: "Reader ID already exists"
            });
        }

        const reader = new Reader({
            readerId,
            fullName,
            dateOfBirth,
            gender,
            address,
            phoneNumber,
            email
        });

        await reader.save();

        res.status(201).json({
            success: true,
            message: "Reader created successfully",
            data: reader
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create reader",
            error: error.message
        });
    }
};

// PUT /admin/readers/:id
module.exports.updateReader = async (req, res) => {
    try {
        const reader = await Reader.findOne({
            readerId: req.params.id
        });

        if (!reader) {
            return res.status(404).json({
                success: false,
                message: "Reader not found"
            });
        }

        const {
            fullName,
            dateOfBirth,
            gender,
            address,
            phoneNumber,
            email,
            status
        } = req.body;

        if (fullName !== undefined) reader.fullName = fullName;
        if (dateOfBirth !== undefined) reader.dateOfBirth = dateOfBirth;
        if (gender !== undefined) reader.gender = gender;
        if (address !== undefined) reader.address = address;
        if (phoneNumber !== undefined) reader.phoneNumber = phoneNumber;
        if (email !== undefined) reader.email = email;
        if (status !== undefined) reader.status = status;

        await reader.save();

        res.status(200).json({
            success: true,
            message: "Reader updated successfully",
            data: reader
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update reader",
            error: error.message
        });
    }
};

// DELETE /admin/readers/:id
module.exports.deleteReader = async (req, res) => {
    try {
        const reader = await Reader.findOne({
            readerId: req.params.id
        });

        if (!reader) {
            return res.status(404).json({
                success: false,
                message: "Reader not found"
            });
        }

        await Reader.deleteOne({
            readerId: req.params.id
        });

        res.status(200).json({
            success: true,
            message: "Reader deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete reader",
            error: error.message
        });
    }
};