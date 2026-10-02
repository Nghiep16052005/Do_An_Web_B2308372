require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const database = require("./Backend/config/database");

const adminRouter = require("./Backend/router/admin/index.route");
const clientRouter = require("./Backend/router/client/index.router");
const sse = require("./Backend/utils/sse.util");

const app = express();


// ====================
// Global Middlewares
// ====================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// ====================
// Database
// ====================

database.connect();


// ====================
// SSE Stream (Real-time notifications)
// ====================

app.get("/api/notifications/stream", sse.subscribe);


// ====================
// Admin Routes
// ====================

app.use("/api/admin", adminRouter);


// ====================
// Client Routes
// ====================

app.use("/api/client", clientRouter);


// ====================
// Health Check
// ====================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Library Management API is running."
    });
});


// ====================
// Start Server
// ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});