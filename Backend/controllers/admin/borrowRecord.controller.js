const BorrowRecord = require("../../models/BorrowRecord.model");
const Book = require("../../models/Book.model");
const Reader = require("../../models/Reader.model");
const Penalty = require("../../models/Penalty.model");
const Notification = require("../../models/Notification.model");
const sse = require("../../utils/sse.util");
const {
    calculateDamagedFine,
    generatePenaltyId
} = require("../../utils/penalty.util");

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

// Tình huống 1: Nhân viên tiếp nhận & kiểm tra thực tế sách tại quầy
module.exports.inspectAndReturn = async (req, res) => {
    try {
        const { id } = req.params; // borrowRecordId
        const { 
            condition, // "Normal" | "LightDamage" | "MediumDamage" | "HeavyDamage" | "Unrecoverable" | "Lost"
            conditionNote, 
            fineAmountOverride 
        } = req.body;

        const employeeId = req.user?.employeeId || "ADMIN";

        const record = await BorrowRecord.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu mượn sách."
            });
        }

        const [book, reader] = await Promise.all([
            Book.findOne({ bookId: record.bookId }),
            Reader.findOne({ readerId: record.readerId })
        ]);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin cuốn sách."
            });
        }

        const bookTitle = book.title;
        const actualCondition = condition || "Normal";

        record.actualCondition = actualCondition;
        record.conditionNote = conditionNote || "";
        record.receivedByEmployeeId = employeeId;
        record.employeeId = employeeId;

        let createdPenalty = null;

        if (actualCondition === "Normal") {
            // Sách bình thường -> Duyệt trả, cộng lại kho
            record.status = "Returned";
            record.returnDate = new Date();
            book.quantity += 1;
            await book.save();

            sse.broadcast("BOOK_QUANTITY_UPDATED", {
                bookId: book.bookId,
                quantity: book.quantity
            });

            const readerNotice = new Notification({
                target: "READER",
                readerId: record.readerId,
                title: "Trả sách thành công tại quầy",
                message: `Nhân viên thư viện đã tiếp nhận cuốn sách "${bookTitle}" (${record.bookId}) trong tình trạng tốt. Cảm ơn bạn!`,
                type: "RETURN"
            });
            await readerNotice.save();
            sse.sendToReader(record.readerId, "NOTIFICATION", readerNotice);

        } else if (actualCondition === "LightDamage" || actualCondition === "MediumDamage") {
            // Trầy xước nhẹ hoặc hư vừa nhưng vẫn phục hồi dùng được
            record.status = "Returned";
            record.returnDate = new Date();
            book.quantity += 1;
            await book.save();

            sse.broadcast("BOOK_QUANTITY_UPDATED", {
                bookId: book.bookId,
                quantity: book.quantity
            });

            const prevDamaged = await Penalty.countDocuments({
                readerId: record.readerId,
                type: "DAMAGED"
            });
            const occurrence = prevDamaged + 1;
            const fine = fineAmountOverride !== undefined && fineAmountOverride !== null && fineAmountOverride !== "" 
                ? Number(fineAmountOverride) 
                : calculateDamagedFine(occurrence);

            createdPenalty = new Penalty({
                penaltyId: generatePenaltyId(),
                readerId: record.readerId,
                bookId: record.bookId,
                borrowRecordId: record._id,
                type: "DAMAGED",
                severity: actualCondition === "LightDamage" ? "LIGHT" : "MEDIUM",
                occurrence: occurrence,
                reason: conditionNote ? `[Kiểm tra tại quầy - ${actualCondition === "LightDamage" ? "Trầy xước nhẹ" : "Hư hỏng vừa"}] ${conditionNote}` : `Phát hiện sách "${bookTitle}" bị hư hại/trầy xước khi trả tại quầy (Lần ${occurrence})`,
                fineAmount: fine,
                status: "Pending",
                reportedBy: "ADMIN",
                handledByEmployeeId: employeeId
            });
            await createdPenalty.save();

            const formattedFine = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(fine);
            const readerNotice = new Notification({
                target: "READER",
                readerId: record.readerId,
                title: `Biên bản vi phạm làm hư/trầy sách (Lần ${occurrence})`,
                message: `Thư viện đã nhận lại sách "${bookTitle}" nhưng phát hiện bị trầy/hư hại (${actualCondition === "LightDamage" ? "mức độ nhẹ" : "mức độ vừa"}). Mức phạt áp dụng là ${formattedFine}. Vui lòng hoàn tất nộp phạt.`,
                type: "PENALTY"
            });
            await readerNotice.save();
            sse.sendToReader(record.readerId, "NOTIFICATION", readerNotice);

        } else if (actualCondition === "HeavyDamage" || actualCondition === "Unrecoverable") {
            // Hư hỏng nặng không thể tái sử dụng
            record.status = "Returned";
            record.returnDate = new Date();

            const fine = fineAmountOverride !== undefined && fineAmountOverride !== null && fineAmountOverride !== ""
                ? Number(fineAmountOverride) 
                : (Number(book.price) || 0);

            const deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // Hạn thanh toán: 3 ngày
            const deadlineText = deadline.toLocaleDateString("vi-VN");

            createdPenalty = new Penalty({
                penaltyId: generatePenaltyId(),
                readerId: record.readerId,
                bookId: record.bookId,
                borrowRecordId: record._id,
                type: "DAMAGED",
                severity: "UNRECOVERABLE",
                occurrence: 1,
                reason: conditionNote ? `[Hỏng nặng không tái sử dụng] ${conditionNote}` : `Sách "${bookTitle}" bị hư hỏng nghiêm trọng khi kiểm tra tại quầy, không thể tiếp tục phục vụ bạn đọc (Đền bù 100% giá sách).`,
                fineAmount: fine,
                status: "Pending",
                reportedBy: "ADMIN",
                paymentDeadline: deadline,
                handledByEmployeeId: employeeId
            });
            await createdPenalty.save();

            const formattedFine = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(fine);
            const readerNotice = new Notification({
                target: "READER",
                readerId: record.readerId,
                title: "Thông báo bồi thường: Sách bị hư hỏng nặng tại quầy",
                message: `Thư viện đã kiểm tra cuốn sách "${bookTitle}" (${record.bookId}) bạn mang đến trả và xác nhận sách bị HƯ HỎNG NẶNG (không thể tái sử dụng). Bạn đọc cần bồi hoàn số tiền ${formattedFine} trước ngày ${deadlineText} (trong vòng 3 ngày). Quá thời hạn này nếu chưa thanh toán, hệ thống sẽ TỰ ĐỘNG KHÓA TÀI KHOẢN TẠM THỜI!`,
                type: "PENALTY"
            });
            await readerNotice.save();
            sse.sendToReader(record.readerId, "NOTIFICATION", readerNotice);

        } else if (actualCondition === "Lost") {
            // Độc giả báo mất sách tại quầy
            record.status = "Lost";

            const fine = fineAmountOverride !== undefined && fineAmountOverride !== null && fineAmountOverride !== ""
                ? Number(fineAmountOverride) 
                : (Number(book.price) || 0);

            const deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // Hạn thanh toán: 3 ngày
            const deadlineText = deadline.toLocaleDateString("vi-VN");

            createdPenalty = new Penalty({
                penaltyId: generatePenaltyId(),
                readerId: record.readerId,
                bookId: record.bookId,
                borrowRecordId: record._id,
                type: "LOST",
                severity: "UNRECOVERABLE",
                occurrence: 1,
                reason: conditionNote ? `[Báo mất tại quầy] ${conditionNote}` : `Xác nhận mất sách "${bookTitle}" khi làm thủ tục trả tại quầy (Đền bù đúng giá niêm yết trên bìa).`,
                fineAmount: fine,
                status: "Pending",
                reportedBy: "ADMIN",
                paymentDeadline: deadline,
                handledByEmployeeId: employeeId
            });
            await createdPenalty.save();

            const formattedFine = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(fine);
            const readerNotice = new Notification({
                target: "READER",
                readerId: record.readerId,
                title: "Biên bản đền bù mất sách tại quầy",
                message: `Thư viện xác nhận ghi nhận làm mất cuốn sách "${bookTitle}" (${record.bookId}). Mức đền bù: ${formattedFine} (100% giá niêm yết bìa sách). Hạn chót thanh toán: ${deadlineText} (3 ngày). Quá thời hạn nếu chưa nộp, tài khoản sẽ bị TỰ ĐỘNG KHÓA TẠM THỜI!`,
                type: "PENALTY"
            });
            await readerNotice.save();
            sse.sendToReader(record.readerId, "NOTIFICATION", readerNotice);
        }

        await record.save();

        sse.sendToReader(record.readerId, "BORROW_RECORD_UPDATED", record);
        sse.sendToAdmins("BORROW_RECORD_UPDATED", record);

        return res.status(200).json({
            success: true,
            message: `Tiếp nhận & kiểm tra sách tại quầy thành công [${actualCondition}].`,
            data: {
                record,
                penalty: createdPenalty
            }
        });

    } catch (error) {
        console.error("Admin inspectAndReturn error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể xử lý tiếp nhận kiểm tra sách tại quầy."
        });
    }
};

// Tình huống 3: Admin xác minh mất sách do quá hạn kéo dài
module.exports.confirmLostByAdmin = async (req, res) => {
    try {
        const { id } = req.params; // borrowRecordId
        const { reason } = req.body;
        const employeeId = req.user?.employeeId || "ADMIN";

        const record = await BorrowRecord.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu mượn sách."
            });
        }

        const book = await Book.findOne({ bookId: record.bookId });
        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin cuốn sách."
            });
        }

        record.status = "Lost";
        record.actualCondition = "Lost";
        record.conditionNote = reason || "Xác minh mất sách sau thời gian dài quá hạn";
        record.receivedByEmployeeId = employeeId;
        await record.save();

        const fineAmount = Number(book.price) || 0;
        const formattedFine = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(fineAmount);

        let penalty = await Penalty.findOne({
            borrowRecordId: record._id,
            type: "LOST"
        });

        if (!penalty) {
            penalty = new Penalty({
                penaltyId: generatePenaltyId(),
                readerId: record.readerId,
                bookId: record.bookId,
                borrowRecordId: record._id,
                type: "LOST",
                severity: "UNRECOVERABLE",
                occurrence: 1,
                reason: reason || `Thư viện xác minh bạn đọc làm mất sách "${book.title}" sau thời gian quá hạn không hoàn trả.`,
                fineAmount: fineAmount,
                status: "Pending",
                reportedBy: "ADMIN",
                handledByEmployeeId: employeeId
            });
            await penalty.save();
        }

        const readerNotice = new Notification({
            target: "READER",
            readerId: record.readerId,
            title: "Xác minh mất sách do quá hạn kéo dài",
            message: `Cuốn sách "${book.title}" (${record.bookId}) đã được xác minh chuyển sang trạng thái MẤT SÁCH. Bạn đọc cần bồi hoàn số tiền ${formattedFine} theo quy định.`,
            type: "PENALTY"
        });
        await readerNotice.save();
        sse.sendToReader(record.readerId, "NOTIFICATION", readerNotice);

        sse.sendToReader(record.readerId, "BORROW_RECORD_UPDATED", record);
        sse.sendToAdmins("BORROW_RECORD_UPDATED", record);

        return res.status(200).json({
            success: true,
            message: `Đã xác nhận mất sách do quá hạn và lập biên bản đền bù ${formattedFine}.`,
            data: {
                record,
                penalty
            }
        });
    } catch (error) {
        console.error("Admin confirmLostByAdmin error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể xác minh mất sách."
        });
    }
};
