const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Employee = require("../../models/Employee.model");

// Employee login
module.exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate required fields
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });
        }

        // Find employee
        const employee = await Employee.findOne({
            username: username
        });

        if (!employee) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        // Check employee status
        if (employee.status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Employee account is inactive."
            });
        }

        // Compare password (supports both bcrypt hash and plain text fallback)
        let isPasswordValid = false;
        if (employee.password.startsWith("$2a$") || employee.password.startsWith("$2b$")) {
            isPasswordValid = await bcrypt.compare(password, employee.password);
        } else {
            isPasswordValid = (password === employee.password);
            if (isPasswordValid) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await Employee.updateOne({ _id: employee._id }, { password: hashedPassword });
            }
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                employeeId: employee.employeeId,
                username: employee.username,
                role: "Employee"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Store token in HTTP-only cookie
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Employee login successful.",
            data: {
                employeeId: employee.employeeId,
                fullName: employee.fullName,
                username: employee.username,
                position: employee.position
            }
        });
    } catch (error) {
        console.error("Employee login error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to login."
        });
    }
};

// Employee logout
module.exports.logout = (req, res) => {
    res.clearCookie("accessToken");

    return res.status(200).json({
        success: true,
        message: "Employee logout successful."
    });
};