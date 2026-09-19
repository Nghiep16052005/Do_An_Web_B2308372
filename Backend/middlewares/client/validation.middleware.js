module.exports.validateReader = (req, res, next) => {
    const {
        fullName,
        dateOfBirth,
        gender,
        address,
        phoneNumber
    } = req.body;

    if (!fullName || !dateOfBirth || !gender || !address || !phoneNumber) {
        return res.status(400).json({
            success: false,
            message: "All required reader fields must be provided."
        });
    }

    next();
};


module.exports.validateBorrowRequest = (req, res, next) => {
    const { bookId } = req.body;

    if (!bookId) {
        return res.status(400).json({
            success: false,
            message: "Book ID is required."
        });
    }

    next();
};