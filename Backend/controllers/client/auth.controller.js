const jwt = require("jsonwebtoken");

const Reader = require("../../models/Reader.model");

// ====================
// Reader Login
// ====================

module.exports.login = async (req, res) => {
    try {
        const { readerId, phoneNumber } = req.body;

        // Validate input
        if (!readerId || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Reader ID and phone number are required."
            });
        }

        // Find reader
        const reader = await Reader.findOne({
            readerId: readerId,
            phoneNumber: phoneNumber
        });

        // Reader not found
        if (!reader) {
            return res.status(401).json({
                success: false,
                message: "Invalid reader ID or phone number."
            });
        }

        // Check reader status
        if (reader.status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Reader account is inactive."
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                readerId: reader.readerId,
                role: "Reader"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Store token in cookie
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Reader login successful.",
            data: {
                readerId: reader.readerId,
                fullName: reader.fullName,
                phoneNumber: reader.phoneNumber,
                email: reader.email,
                status: reader.status
            }
        });

    } catch (error) {
        console.error("Reader login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
};

// ====================
// Reader Logout
// ====================

module.exports.logout = async (req, res) => {
    try {
        res.clearCookie("accessToken");

        return res.status(200).json({
            success: true,
            message: "Reader logout successful."
        });

    } catch (error) {
        console.error("Reader logout error:", error);

        return res.status(500).json({
            success: false,
            message: "Logout failed."
        });
    }
};
