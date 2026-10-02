const BorrowRecord = require("../../models/BorrowRecord.model");
const Book = require("../../models/Book.model");
const Reader = require("../../models/Reader.model");
const Notification = require("../../models/Notification.model");
const sse = require("../../utils/sse.util");

// Get all borrow records for Admin
module.exports.getAllBorrowRecords = async (req, res) => {
    try {
        const records = await BorrowRecord.find().sort({ borrowDate: -1, createdAt: -1 }).lean();

        // Populate book title and reader name for better presentation
        const bookIds = [...new Set(records.map(r => r.bookId))];
        const readerIds = [...new Set(records.map(r => r.readerId))];

        const [books, readers] = await Promise.all([
            Book.find({ bookId: { $in: bookIds } }).select("bookId title").lean(),
            Reader.find({ readerId: { $in: readerIds } }).select("readerId fullName").lean()
        ]);

        const bookMap = new Map(books.map(b => [b.bookId, b.title]));
        const readerMap = new Map(readers.map(r => [r.readerId, r.fullName]));

        const enrichedRecords = records.map(record => ({
            ...record,
            bookTitle: bookMap.get(record.bookId) || record.bookId,
            readerName: readerMap.get(record.readerId) || record.readerId
        }));

        return res.status(200).json({
            success: true,
            count: enrichedRecords.length,
            data: enrichedRecords
        });
    } catch (error) {
        console.error("Admin get borrow records error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve borrow records."
        });
    }
};

// Get single borrow record by ID
module.exports.getBorrowRecordById = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await BorrowRecord.findById(id).lean();

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Borrow record not found."
            });
        }

        const [book, reader] = await Promise.all([
            Book.findOne({ bookId: record.bookId }).select("bookId title author image price").lean(),
            Reader.findOne({ readerId: record.readerId }).select("readerId fullName phoneNumber email").lean()
        ]);

        return res.status(200).json({
            success: true,
            data: {
                ...record,
                book,
                reader
            }
        });
    } catch (error) {
        console.error("Admin get record detail error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve borrow record details."
        });
    }
};

// Update status (e.g. Return book)
module.exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const record = await BorrowRecord.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Borrow record not found."
            });
        }

        const oldStatus = record.status;
        record.status = status;

        // If returned
        if (status === "Returned" && oldStatus !== "Returned") {
            record.returnDate = new Date();
            if (req.user?.employeeId) {
                record.employeeId = req.user.employeeId;
            }

            // Restore book quantity
            const book = await Book.findOne({ bookId: record.bookId });
            if (book) {
                book.quantity += 1;
                await book.save();

                // Broadcast real-time book quantity update
                sse.broadcast("BOOK_QUANTITY_UPDATED", {
                    bookId: book.bookId,
                    quantity: book.quantity
                });
            }

            const bookTitle = book ? book.title : record.bookId;

            // Create Reader notification: Trả sách thành công khi Admin duyệt
            const readerNotification = new Notification({
                target: "READER",
                readerId: record.readerId,
                title: "Trả sách thành công",
                message: `Quản trị viên đã duyệt yêu cầu trả sách "${bookTitle}" (${record.bookId}) của bạn thành công. Cảm ơn bạn!`,
                type: "RETURN"
            });
            await readerNotification.save();

            // Send real-time event to Reader
            sse.sendToReader(record.readerId, "NOTIFICATION", readerNotification);
            sse.sendToReader(record.readerId, "BORROW_RECORD_UPDATED", record);
        }

        await record.save();

        // Broadcast to admins
        sse.sendToAdmins("BORROW_RECORD_UPDATED", record);

        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái phiếu mượn thành công.",
            data: record
        });
    } catch (error) {
        console.error("Admin update borrow record error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật trạng thái phiếu mượn."
        });
    }
};
