module.exports.validateBook = (req, res, next) => {
    const {
        bookId,
        title,
        author,
        publisherId,
        publicationYear,
        price,
        quantity
    } = req.body;

    if (
        !bookId ||
        !title ||
        !author ||
        !publisherId ||
        publicationYear === undefined ||
        price === undefined ||
        quantity === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "All required book fields must be provided."
        });
    }

    next();
};

module.exports.validatePublisher = (req, res, next) => {
    const {
        publisherId,
        name,
        address,
        phoneNumber
    } = req.body;

    if (
        !publisherId ||
        !name ||
        !address ||
        !phoneNumber
    ) {
        return res.status(400).json({
            success: false,
            message: "All required publisher fields must be provided."
        });
    }

    next();
};

module.exports.validateReader = (req, res, next) => {
    const {
        readerId,
        fullName,
        dateOfBirth,
        gender,
        address,
        phoneNumber
    } = req.body;

    if (
        !readerId ||
        !fullName ||
        !dateOfBirth ||
        !gender ||
        !address ||
        !phoneNumber
    ) {
        return res.status(400).json({
            success: false,
            message: "All required reader fields must be provided."
        });
    }

    next();
};

module.exports.validateEmployee = (req, res, next) => {
    const {
        employeeId,
        fullName,
        username,
        password,
        position,
        phoneNumber,
        address
    } = req.body;

    if (
        !employeeId ||
        !fullName ||
        !username ||
        !password ||
        !position ||
        !phoneNumber ||
        !address
    ) {
        return res.status(400).json({
            success: false,
            message: "All required employee fields must be provided."
        });
    }

    next();
};