module.exports.notFound = (req, res, next) => {
    const error = new Error(
        `Route not found: ${req.originalUrl}`
    );

    error.statusCode = 404;

    next(error);
};


module.exports.errorHandler = (error, req, res, next) => {
    console.error(error);

    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error."
    });
};