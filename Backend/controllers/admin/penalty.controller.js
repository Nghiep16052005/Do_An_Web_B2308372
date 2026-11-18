const Penalty = require("../../models/Penalty.model");
const BorrowRecord = require("../../models/BorrowRecord.model");
const Book = require("../../models/Book.model");
const Reader = require("../../models/Reader.model");
const Notification = require("../../models/Notification.model");
const sse = require("../../utils/sse.util");
const {
    calculateDamagedFine,
    generatePenaltyId,
    syncReaderAccountLockStatus,
    scanAndLockAllOverduePenalties
} = require("../../utils/penalty.util");

// Lấy tất cả biên bản vi phạm & tiền phạt cho Admin
module.exports.getAllPenalties = async (req, res) => {
    try {
        // Tự động quét và khóa tài khoản các độc giả có khoản phạt nợ quá 3 ngày
        await scanAndLockAllOverduePenalties();

        const penalties = await Penalty.find().sort({ createdAt: -1 }).lean();

        const bookIds = [...new Set(penalties.map(p => p.bookId))];
        const readerIds = [...new Set(penalties.map(p => p.readerId))];

        const [books, readers] = await Promise.all([
            Book.find({ bookId: { $in: bookIds } }).select("bookId title price image").lean(),
            Reader.find({ readerId: { $in: readerIds } }).select("readerId fullName phoneNumber email").lean()
        ]);

        const bookMap = new Map(books.map(b => [b.bookId, b]));
        const readerMap = new Map(readers.map(r => [r.readerId, r]));

        const enrichedPenalties = penalties.map(p => ({
            ...p,
            book: bookMap.get(p.bookId) || null,
            bookTitle: bookMap.get(p.bookId)?.title || p.bookId,
            reader: readerMap.get(p.readerId) || null,
            readerName: readerMap.get(p.readerId)?.fullName || p.readerId
        }));

        const totalUnpaid = enrichedPenalties
            .filter(p => p.status === "Pending")
            .reduce((sum, p) => sum + (p.fineAmount || 0), 0);

        return res.status(200).json({
            success: true,
            count: enrichedPenalties.length,
            totalUnpaid: Math.round(totalUnpaid * 100) / 100,
            data: enrichedPenalties
        });
    } catch (error) {
        console.error("Admin get all penalties error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách vi phạm và tiền phạt."
        });
    }
};

// Cập nhật trạng thái phiếu phạt (Ví dụ: Đã thu tiền - Paid, hoặc Miễn phạt - Waived)
module.exports.updatePenaltyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const penalty = await Penalty.findById(id);
        if (!penalty) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy biên bản phạt."
            });
        }

        penalty.status = status;
        if (status === "Paid") {
            penalty.paidAt = new Date();
        } else if (status === "Pending") {
            penalty.paidAt = null;
        }

        await penalty.save();

        // Tự động đồng bộ mở khóa tài khoản nếu độc giả đã thanh toán hoặc được miễn nợ
        if (status === "Paid" || status === "Waived" || status === "Cancelled") {
            await syncReaderAccountLockStatus(penalty.readerId);
        }

        const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(penalty.fineAmount);

        // Thông báo cho độc giả
        const readerNotification = new Notification({
            target: "READER",
            readerId: penalty.readerId,
            title: status === "Paid" ? "NỘP PHẠT THÀNH CÔNG!" : "Cập nhật trạng thái biên bản phạt",
            message: status === "Paid"
                ? `Thư viện đã xác nhận thu khoản tiền phạt ${formattedAmount} cho mã phạt ${penalty.penaltyId}. Cảm ơn bạn đã hoàn thành nộp phạt!`
                : `Biên bản phạt ${penalty.penaltyId} đã được cập nhật trạng thái: ${status}.`,
            type: status === "Paid" ? "SYSTEM" : "PENALTY"
        });
        await readerNotification.save();

        sse.sendToReader(penalty.readerId, "NOTIFICATION", readerNotification);
        if (status === "Paid") {
            sse.sendToReader(penalty.readerId, "PENALTY_APPROVED", penalty);
        }
        sse.sendToReader(penalty.readerId, "PENALTY_UPDATED", penalty);
        sse.sendToAdmins("PENALTY_UPDATED", penalty);

        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái phiếu phạt thành công.",
            data: penalty
        });
    } catch (error) {
        console.error("Admin update penalty status error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật trạng thái phiếu phạt."
        });
    }
};

// Quản trị viên duyệt thanh toán chuyển khoản của độc giả
module.exports.approvePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user?.employeeId || "ADMIN";

        const penalty = await Penalty.findById(id);
        if (!penalty) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy biên bản phạt."
            });
        }

        penalty.status = "Paid";
        penalty.paidAt = new Date();
        penalty.handledByEmployeeId = employeeId;
        await penalty.save();

        // Tự động đồng bộ mở khóa tài khoản cho độc giả
        await syncReaderAccountLockStatus(penalty.readerId);

        const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(penalty.fineAmount);

        // Thông báo gửi đến Độc giả: Nộp phạt thành công!
        const readerNotification = new Notification({
            target: "READER",
            readerId: penalty.readerId,
            title: "NỘP PHẠT THÀNH CÔNG!",
            message: `Quản lý thư viện đã duyệt khoản thanh toán chuyển khoản ${formattedAmount} cho mã phạt ${penalty.penaltyId}. Biên bản vi phạm đã được đánh dấu hoàn tất. Cảm ơn bạn!`,
            type: "SYSTEM"
        });
        await readerNotification.save();

        // Realtime SSE
        sse.sendToReader(penalty.readerId, "NOTIFICATION", readerNotification);
        sse.sendToReader(penalty.readerId, "PENALTY_APPROVED", penalty);
        sse.sendToReader(penalty.readerId, "PENALTY_UPDATED", penalty);
        sse.sendToAdmins("PENALTY_UPDATED", penalty);

        return res.status(200).json({
            success: true,
            message: `Đã duyệt thanh toán thành công cho mã phạt ${penalty.penaltyId}.`,
            data: penalty
        });

    } catch (error) {
        console.error("Admin approve payment error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể duyệt thanh toán."
        });
    }
};

// Quản trị viên từ chối xác nhận thanh toán (nếu chưa nhận được tiền trong tài khoản)
module.exports.rejectPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const penalty = await Penalty.findById(id);
        if (!penalty) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy biên bản phạt."
            });
        }

        penalty.status = "Pending";
        penalty.paymentNote = reason ? `[Thủ thư từ chối] ${reason}` : "[Thủ thư từ chối] Chưa nhận được tiền trong tài khoản";
        await penalty.save();

        const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(penalty.fineAmount);

        const readerNotification = new Notification({
            target: "READER",
            readerId: penalty.readerId,
            title: "Yêu cầu kiểm tra lại chuyển khoản nộp phạt",
            message: `Thư viện chưa nhận được tiền chuyển khoản cho mã phạt ${penalty.penaltyId} (${formattedAmount}). Lý do: ${penalty.paymentNote}. Vui lòng kiểm tra lại giao dịch hoặc liên hệ quầy thư viện.`,
            type: "WARNING"
        });
        await readerNotification.save();

        sse.sendToReader(penalty.readerId, "NOTIFICATION", readerNotification);
        sse.sendToReader(penalty.readerId, "PENALTY_UPDATED", penalty);
        sse.sendToAdmins("PENALTY_UPDATED", penalty);

        return res.status(200).json({
            success: true,
            message: "Đã từ chối xác nhận và gửi thông báo yêu cầu kiểm tra lại cho độc giả.",
            data: penalty
        });

    } catch (error) {
        console.error("Admin reject payment error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể từ chối thanh toán."
        });
    }
};

// Quản trị viên chủ động lập biên bản phạt
module.exports.createPenalty = async (req, res) => {
    try {
        const { readerId, bookId, borrowRecordId, type, reason, fineAmount } = req.body;

        if (!readerId || !bookId || !type) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bắt buộc để lập biên bản phạt."
            });
        }

        const [book, reader] = await Promise.all([
            Book.findOne({ bookId }),
            Reader.findOne({ readerId })
        ]);

        if (!book || !reader) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin sách hoặc độc giả."
            });
        }

        let calculatedFine = Number(fineAmount);

        if (type === "LOST") {
            // Mất sách: đúng giá niêm yết trên bìa
            calculatedFine = Number(book.price) || 0;
        } else if (type === "DAMAGED" && !fineAmount) {
            // Hư sách: tính theo lũy tiến lần vi phạm
            const prevDamaged = await Penalty.countDocuments({ readerId, type: "DAMAGED" });
            calculatedFine = calculateDamagedFine(prevDamaged + 1);
        } else if (type === "OVERDUE" && !fineAmount) {
            calculatedFine = 1.00;
        }

        const penalty = new Penalty({
            penaltyId: generatePenaltyId(),
            readerId,
            bookId,
            borrowRecordId: borrowRecordId || null,
            type,
            reason: reason || `Quản trị viên lập biên bản vi phạm ${type}`,
            fineAmount: calculatedFine,
            status: "Pending",
            reportedBy: "ADMIN"
        });

        await penalty.save();

        if (type === "LOST" && borrowRecordId) {
            await BorrowRecord.findByIdAndUpdate(borrowRecordId, { status: "Lost" });
        }

        const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(calculatedFine);

        const readerNotification = new Notification({
            target: "READER",
            readerId,
            title: `Biên bản phạt mới từ Thư viện (${type})`,
            message: `Thư viện đã lập biên bản phạt cho cuốn sách "${book.title}" (${bookId}). Mức phạt: ${formattedAmount}. Lý do: ${penalty.reason}.`,
            type: "PENALTY"
        });
        await readerNotification.save();
        sse.sendToReader(readerId, "NOTIFICATION", readerNotification);

        return res.status(201).json({
            success: true,
            message: `Lập biên bản phạt thành công. Mức phạt: ${formattedAmount}.`,
            data: penalty
        });
    } catch (error) {
        console.error("Admin create penalty error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể tạo biên bản phạt."
        });
    }
};

// Tình huống 2: Tiếp nhận sách đã từng báo mất nay độc giả tìm lại được và mang trả
module.exports.returnFoundBook = async (req, res) => {
    try {
        const { penaltyId, borrowRecordId, condition, conditionNote } = req.body;
        const employeeId = req.user?.employeeId || "ADMIN";

        let penalty = null;
        if (penaltyId) {
            penalty = await Penalty.findOne({ penaltyId });
        } else if (borrowRecordId) {
            penalty = await Penalty.findOne({ borrowRecordId, type: "LOST" });
        }

        let record = null;
        if (borrowRecordId) {
            record = await BorrowRecord.findById(borrowRecordId);
        } else if (penalty && penalty.borrowRecordId) {
            record = await BorrowRecord.findById(penalty.borrowRecordId);
        }

        if (!record && !penalty) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin phiếu mượn hoặc biên bản phạt mất sách."
            });
        }

        const bookId = record ? record.bookId : penalty.bookId;
        const readerId = record ? record.readerId : penalty.readerId;

        const book = await Book.findOne({ bookId });
        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy cuốn sách."
            });
        }

        const actualCondition = condition || "Normal";

        // 1. Cập nhật phiếu mượn sang FoundReturned
        if (record) {
            record.status = "FoundReturned";
            record.returnDate = new Date();
            record.actualCondition = actualCondition;
            record.conditionNote = conditionNote || "Độc giả đã tìm lại được sách và mang trả";
            record.receivedByEmployeeId = employeeId;
            await record.save();
        }

        // 2. Nhập sách lại vào kho (+1)
        book.quantity += 1;
        await book.save();
        sse.broadcast("BOOK_QUANTITY_UPDATED", {
            bookId: book.bookId,
            quantity: book.quantity
        });

        // 3. Xử lý biên bản phạt mất sách: Huỷ bỏ nếu đang Pending
        let replacementPenalty = null;
        if (penalty) {
            penalty.handledByEmployeeId = employeeId;
            if (penalty.status === "Pending") {
                penalty.status = "Cancelled";
                penalty.cancellationReason = `Độc giả đã tìm thấy và trả lại sách vào ngày ${new Date().toLocaleDateString("vi-VN")}. Tình trạng sách: ${actualCondition}.`;
                await penalty.save();
            } else if (penalty.status === "Paid") {
                penalty.cancellationReason = `Độc giả đã tìm thấy sách sau khi đã nộp tiền phạt. Thư viện đã tiếp nhận lại sách vào kho.`;
                await penalty.save();
            }
        }

        // 4. Nếu sách tìm lại bị trầy hại thì tạo biên bản phạt hư hại thay thế
        if (actualCondition === "LightDamage" || actualCondition === "MediumDamage") {
            const prevDamaged = await Penalty.countDocuments({ readerId, type: "DAMAGED" });
            const occurrence = prevDamaged + 1;
            const fine = calculateDamagedFine(occurrence);

            replacementPenalty = new Penalty({
                penaltyId: generatePenaltyId(),
                readerId,
                bookId,
                borrowRecordId: record ? record._id : null,
                type: "DAMAGED",
                severity: actualCondition === "LightDamage" ? "LIGHT" : "MEDIUM",
                occurrence,
                reason: `Sách "${book.title}" tìm lại được nhưng bị trầy/hư hại (Lần ${occurrence})`,
                fineAmount: fine,
                status: "Pending",
                reportedBy: "ADMIN",
                handledByEmployeeId: employeeId
            });
            await replacementPenalty.save();
        }

        // 5. Tự động kiểm tra mở khóa tài khoản cho độc giả sau khi hủy phạt mất sách
        await syncReaderAccountLockStatus(readerId);

        // 6. Gửi thông báo đến độc giả
        const readerNotice = new Notification({
            target: "READER",
            readerId,
            title: "Tiếp nhận sách tìm lại thành công",
            message: `Thư viện đã tiếp nhận lại cuốn sách "${book.title}" (${bookId}) mà bạn đã tìm thấy. Khoản phạt đền bù sách mất đã được huỷ bỏ.${replacementPenalty ? ` Phát sinh mức phạt trầy xước: ${replacementPenalty.fineAmount}$.` : ""}`,
            type: "SYSTEM"
        });
        await readerNotice.save();
        sse.sendToReader(readerId, "NOTIFICATION", readerNotice);

        if (record) {
            sse.sendToReader(record.readerId, "BORROW_RECORD_UPDATED", record);
            sse.sendToAdmins("BORROW_RECORD_UPDATED", record);
        }

        return res.status(200).json({
            success: true,
            message: "Đã tiếp nhận sách tìm lại, hoàn trả số lượng vào kho và huỷ khoản phạt đền bù sách mất.",
            data: {
                record,
                penalty,
                replacementPenalty
            }
        });

    } catch (error) {
        console.error("Admin returnFoundBook error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể xử lý tiếp nhận sách tìm lại."
        });
    }
};
