const jwt = require("jsonwebtoken");

const Reader = require("../../models/Reader.model");
const { checkAndApplyOverduePenalties } = require("../../utils/penalty.util");

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

        // Quét tự động nợ phạt quá 3 ngày để cập nhật trạng thái mới nhất
        await checkAndApplyOverduePenalties(reader.readerId);
        const currentReader = await Reader.findOne({ readerId: reader.readerId }) || reader;

        // Chặn hoàn toàn nếu tài khoản Inactive (bị vô hiệu hóa thủ công)
        if (currentReader.status === "Inactive") {
            return res.status(403).json({
                success: false,
                message: "Tài khoản độc giả chưa kích hoạt hoặc đã ngừng hoạt động."
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                readerId: currentReader.readerId,
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
            message: currentReader.status === "Blocked"
                ? "Đăng nhập thành công. Chú ý: Tài khoản của bạn đang bị khóa mượn sách tạm thời do quá hạn nộp phạt 3 ngày."
                : "Reader login successful.",
            data: {
                readerId: currentReader.readerId,
                fullName: currentReader.fullName,
                phoneNumber: currentReader.phoneNumber,
                email: currentReader.email,
                status: currentReader.status,
                lockReason: currentReader.lockReason || ""
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
