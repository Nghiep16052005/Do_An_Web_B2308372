const BorrowRecord = require("../../models/BorrowRecord.model");
const Book = require("../../models/Book.model");
const Reader = require("../../models/Reader.model");
const Notification = require("../../models/Notification.model");
const sse = require("../../utils/sse.util");

// Get current reader's borrow records
module.exports.getMyBorrowRecords = async (req, res) => {
    try {
        const readerId = req.user.readerId;

        const borrowRecords = await BorrowRecord.find({
            readerId: readerId
        }).sort({ borrowDate: -1 });

        const bookIds = [...new Set(borrowRecords.map(r => r.bookId))];
        const books = await Book.find({ bookId: { $in: bookIds } }).select("bookId title author image price").lean();
        const bookMap = new Map(books.map(b => [b.bookId, b]));

        const enrichedRecords = borrowRecords.map(r => ({
            ...r.toObject(),
            book: bookMap.get(r.bookId) || null,
            bookTitle: bookMap.get(r.bookId)?.title || r.bookId
        }));

        return res.status(200).json({
            success: true,
            count: enrichedRecords.length,
            data: enrichedRecords
        });
    } catch (error) {
        console.error("Get borrow records error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve borrow records."
        });
    }
};

// Borrow a book
module.exports.borrowBook = async (req, res) => {
    try {
        const readerId = req.user.readerId;
        const { bookId, dueDate } = req.body;

        // Check reader
        const reader = await Reader.findOne({
            readerId: readerId
        });

        if (!reader) {
            return res.status(404).json({
                success: false,
                message: "Reader not found."
            });
        }

        // Check reader status
        if (reader.status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Reader account is inactive."
            });
        }

        // Check book
        const book = await Book.findOne({
            bookId: bookId
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        // Check book availability
        if (book.quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Sách hiện tại đã hết, không thể mượn."
            });
        }

        // Check whether the reader is already borrowing this book
        const existingBorrowRecord = await BorrowRecord.findOne({
            readerId: readerId,
            bookId: bookId,
            status: { $in: ["Borrowing", "ReturnPending"] }
        });

        if (existingBorrowRecord) {
            return res.status(400).json({
                success: false,
                message: "Bạn đang mượn hoặc đang gửi yêu cầu trả cuốn sách này rồi, vui lòng đợi duyệt trước khi mượn tiếp."
            });
        }

        // Create borrow record
        const borrowRecord = new BorrowRecord({
            readerId: readerId,
            bookId: bookId,
            employeeId: "SYSTEM",
            borrowDate: new Date(),
            dueDate: dueDate,
            status: "Borrowing"
        });

        await borrowRecord.save();

        // Decrease available quantity
        book.quantity -= 1;
        await book.save();

        const formattedDueDate = new Date(dueDate).toLocaleDateString("vi-VN");

        // 1. Create notification for Admins
        const adminNotification = new Notification({
            target: "ADMIN",
            title: "Yêu cầu mượn sách mới",
            message: `Độc giả ${reader.fullName} (${readerId}) vừa mượn sách "${book.title}" (${bookId}). Hạn trả: ${formattedDueDate}.`,
            type: "BORROW"
        });
        await adminNotification.save();

        // 2. Create notification for Reader
        const readerNotification = new Notification({
            target: "READER",
            readerId: readerId,
            title: "Mượn sách thành công",
            message: `Bạn đã mượn thành công sách "${book.title}". Vui lòng hoàn trả trước ngày ${formattedDueDate}.`,
            type: "BORROW"
        });
        await readerNotification.save();

        // 3. Real-time broadcast via SSE
        sse.sendToAdmins("NOTIFICATION", adminNotification);
        sse.sendToAdmins("NEW_BORROW", {
            record: {
                ...borrowRecord.toObject(),
                bookTitle: book.title,
                readerName: reader.fullName
            }
        });
        sse.sendToReader(readerId, "NOTIFICATION", readerNotification);
        sse.broadcast("BOOK_QUANTITY_UPDATED", {
            bookId: book.bookId,
            quantity: book.quantity
        });

        return res.status(201).json({
            success: true,
            message: "Mượn sách thành công.",
            data: borrowRecord
        });
    } catch (error) {
        console.error("Borrow book error:", error);

        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi mượn sách."
        });
    }
};

// Request return for a borrowed book (Độc giả gửi yêu cầu trả sách chờ Admin duyệt)
module.exports.returnBook = async (req, res) => {
    try {
        const readerId = req.user.readerId;
        const { id } = req.params;

        // Find borrow record
        const borrowRecord = await BorrowRecord.findOne({
            _id: id,
            readerId: readerId,
            status: "Borrowing"
        });

        if (!borrowRecord) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu mượn đang hiệu lực để yêu cầu trả sách."
            });
        }

        // Find book & reader
        const [book, reader] = await Promise.all([
            Book.findOne({ bookId: borrowRecord.bookId }),
            Reader.findOne({ readerId: readerId })
        ]);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sách tương ứng."
            });
        }

        // Update borrow record status to ReturnPending (Chờ duyệt trả)
        borrowRecord.status = "ReturnPending";
        await borrowRecord.save();

        const readerName = reader ? reader.fullName : readerId;

        // 1. Create notification for Admins
        const adminNotification = new Notification({
            target: "ADMIN",
            title: "Yêu cầu trả sách mới",
            message: `Độc giả ${readerName} (${readerId}) vừa gửi yêu cầu trả sách "${book.title}" (${book.bookId}). Vui lòng kiểm tra và duyệt.`,
            type: "RETURN"
        });
        await adminNotification.save();

        // 2. Real-time broadcast via SSE to Admins
        sse.sendToAdmins("NOTIFICATION", adminNotification);
        sse.sendToAdmins("BORROW_RECORD_UPDATED", borrowRecord);
        sse.sendToAdmins("RETURN_REQUEST", {
            record: borrowRecord.toObject(),
            bookTitle: book.title,
            readerName: readerName
        });

        // 3. Notify Reader that request has been submitted
        sse.sendToReader(readerId, "BORROW_RECORD_UPDATED", borrowRecord);

        return res.status(200).json({
            success: true,
            message: `Đã gửi yêu cầu trả cuốn sách "${book.title}" thành công. Vui lòng chờ quản trị viên duyệt!`,
            data: borrowRecord
        });
    } catch (error) {
        console.error("Return book request error:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể gửi yêu cầu hoàn trả sách."
        });
    }
};
