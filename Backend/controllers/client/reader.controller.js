const Reader = require("../../models/Reader.model");


// Get current reader profile
module.exports.getProfile = async (req, res) => {
    try {
        const readerId = req.user.readerId;

        const reader = await Reader.findOne({
            readerId: readerId
        }).select("-__v");

        if (!reader) {
            return res.status(404).json({
                success: false,
                message: "Reader not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: reader
        });
    } catch (error) {
        console.error("Get reader profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve reader profile."
        });
    }
};


// Update current reader profile
module.exports.updateProfile = async (req, res) => {
    try {
        const readerId = req.user.readerId;

        const {
            fullName,
            dateOfBirth,
            gender,
            address,
            phoneNumber,
            email
        } = req.body;

        const reader = await Reader.findOne({
            readerId: readerId
        });

        if (!reader) {
            return res.status(404).json({
                success: false,
                message: "Reader not found."
            });
        }

        if (fullName !== undefined) {
            reader.fullName = fullName;
        }

        if (dateOfBirth !== undefined) {
            reader.dateOfBirth = dateOfBirth;
        }

        if (gender !== undefined) {
            reader.gender = gender;
        }

        if (address !== undefined) {
            reader.address = address;
        }

        if (phoneNumber !== undefined) {
            reader.phoneNumber = phoneNumber;
        }

        if (email !== undefined) {
            reader.email = email;
        }

        await reader.save();

        return res.status(200).json({
            success: true,
            message: "Reader profile updated successfully.",
            data: reader
        });
    } catch (error) {
        console.error("Update reader profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update reader profile."
        });
    }
};
