const jwt = require("jsonwebtoken");

module.exports.requireAuth = (req, res, next) => {
    try {
        const token = req.cookies?.adminToken || req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Vui lòng đăng nhập quyền Quản trị viên."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        });
    }
};

module.exports.requireEmployee = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Vui lòng đăng nhập để tiếp tục."
        });
    }

    if (req.user.role !== "Employee") {
        return res.status(403).json({
            success: false,
            message: "Bạn không có quyền truy cập trang Quản trị (Cần tài khoản Nhân viên/Thủ thư)."
        });
    }

    next();
};