const Penalty = require("../../models/Penalty.model");
const BorrowRecord = require("../../models/BorrowRecord.model");
const Book = require("../../models/Book.model");
const Reader = require("../../models/Reader.model");
const Notification = require("../../models/Notification.model");
const sse = require("../../utils/sse.util");
const {
    calculateDamagedFine,
    generatePenaltyId,
    checkAndApplyOverduePenalties,
    syncReaderAccountLockStatus
} = require("../../utils/penalty.util");

// Lấy danh sách vi phạm & tiền phạt của độc giả hiện tại
module.exports.getMyPenalties = async (req, res) => {
    try {
        const readerId = req.user.readerId;

        // Quét tự động các phiếu mượn quá hạn để cập nhật cảnh cáo / phạt trễ hạn
        await checkAndApplyOverduePenalties(readerId);

        const penalties = await Penalty.find({ readerId: readerId })
            .sort({ createdAt: -1 })
            .lean();

        // Lấy thông tin sách để hiển thị nhan đề & ảnh bìa
        const bookIds = [...new Set(penalties.map(p => p.bookId))];
        const books = await Book.find({ bookId: { $in: bookIds } })
            .select("bookId title image price author")
            .lean();
        const bookMap = new Map(books.map(b => [b.bookId, b]));

        const enrichedPenalties = penalties.map(p => ({
            ...p,
            book: bookMap.get(p.bookId) || null,
            bookTitle: bookMap.get(p.bookId)?.title || p.bookId
        }));

        // Thống kê nhanh
        const totalPendingAmount = enrichedPenalties
            .filter(p => p.status === "Pending")
            .reduce((sum, p) => sum + (p.fineAmount || 0), 0);

        const damagedCount = await Penalty.countDocuments({ readerId: readerId, type: "DAMAGED" });
        const overdueCount = await Penalty.countDocuments({ readerId: readerId, type: "OVERDUE" });
        const lostCount = await Penalty.countDocuments({ readerId: readerId, type: "LOST" });

        return res.status(200).json({
            success: true,
            data: enrichedPenalties,
            stats: {
                totalPendingAmount: Math.round(totalPendingAmount * 100) / 100,
                damagedCount,
                overdueCount,
                lostCount,
                nextDamagedFine: calculateDamagedFine(damagedCount + 1),
                nextDamagedOccurrence: damagedCount + 1
            }
        });
    } catch (error) {
        console.error("Get my penalties error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể tải danh sách vi phạm và tiền phạt."
        });
    }
};

// Lấy thông tin dự toán mức phạt làm hư/trầy sách trước khi điền form
module.exports.getDamageViolationEstimate = async (req, res) => {
    try {
        const readerId = req.user.readerId;
        const currentDamagedCount = await Penalty.countDocuments({
            readerId: readerId,
            type: "DAMAGED"
        });

        const nextOccurrence = currentDamagedCount + 1;
        const fineAmount = calculateDamagedFine(nextOccurrence);

        return res.status(200).json({
            success: true,
            data: {
                currentDamagedCount,
                nextOccurrence,
                fineAmount
            }
        });
    } catch (error) {
        console.error("Get damage estimate error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin mức phạt hư hỏng."
        });
    }
};

// Form khai báo làm mất sách (Đền bù đúng với số tiền niêm yết trên bìa sách)
module.exports.reportLostBook = async (req, res) => {
    try {
        const readerId = req.user.readerId;
        const { borrowRecordId, reason } = req.body;

        if (!borrowRecordId) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn cuốn sách bị mất."
            });
        }

        // Tìm phiếu mượn
        const record = await BorrowRecord.findOne({
            _id: borrowRecordId,
            readerId: readerId,
            status: { $in: ["Borrowing", "Overdue", "ReturnPending"] }
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu mượn sách hợp lệ để báo mất."
            });
        }

        // Tìm thông tin sách để lấy giá niêm yết trên bìa
        const [book, reader] = await Promise.all([
            Book.findOne({ bookId: record.bookId }),
            Reader.findOne({ readerId: readerId })
        ]);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin cuốn sách."
            });
        }

        // Đền bù đúng với giá niêm yết trên bìa
        const bookCoverPrice = Number(book.price) || 0;

        // Đếm số lần làm mất sách của độc giả
        const lostCount = await Penalty.countDocuments({
            readerId: readerId,
            type: "LOST"
        });
        const occurrence = lostCount + 1;

        // Tạo bản ghi phạt bồi thường làm mất sách
        const penalty = new Penalty({
            penaltyId: generatePenaltyId(),
            readerId: readerId,
            bookId: record.bookId,
            borrowRecordId: record._id,
            type: "LOST",
            occurrence: occurrence,
            reason: reason || `Độc giả báo làm mất sách "${book.title}". Đền bù theo giá niêm yết bìa sách.`,
            fineAmount: bookCoverPrice,
            status: "Pending",
            reportedBy: "READER"
        });

        await penalty.save();

        // Cập nhật trạng thái phiếu mượn thành "Lost"
        record.status = "Lost";
        await record.save();

        const readerName = reader ? reader.fullName : readerId;
        const formattedPrice = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(bookCoverPrice);

        // 1. Tạo thông báo cho Độc giả
        const readerNotification = new Notification({
            target: "READER",
            readerId: readerId,
            title: "Xác nhận báo mất sách & Đền bù",
            message: `Bạn đã khai báo làm mất cuốn sách "${book.title}" (${record.bookId}). Số tiền đền bù theo giá niêm yết trên bìa là ${formattedPrice}. Vui lòng nộp phạt cho thư viện.`,
            type: "PENALTY"
        });
        await readerNotification.save();

        // 2. Tạo thông báo cho Admin
        const adminNotification = new Notification({
            target: "ADMIN",
            title: "Độc giả khai báo làm mất sách",
            message: `Độc giả ${readerName} (${readerId}) vừa khai báo làm mất sách "${book.title}" (${record.bookId}). Mức đền bù giá bìa: ${formattedPrice}.`,
            type: "PENALTY"
        });
        await adminNotification.save();

        // Real-time broadcast
        sse.sendToReader(readerId, "NOTIFICATION", readerNotification);
        sse.sendToReader(readerId, "BORROW_RECORD_UPDATED", record);
        sse.sendToAdmins("NOTIFICATION", adminNotification);
        sse.sendToAdmins("BORROW_RECORD_UPDATED", record);

        return res.status(201).json({
            success: true,
            message: `Khai báo làm mất sách thành công. Mức đền bù niêm yết: ${formattedPrice}.`,
            data: penalty
        });
    } catch (error) {
        console.error("Report lost book error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể xử lý yêu cầu báo mất sách."
        });
    }
};

// Form khai báo làm trầy / làm hư sách (Lần 1: 0.25$, Lần 2: 0.25*2=0.50$, Lần 3: 0.5*3=1.50$)
module.exports.reportDamagedBook = async (req, res) => {
    try {
        const readerId = req.user.readerId;
        const { borrowRecordId, reason, damageType } = req.body;

        if (!borrowRecordId) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn cuốn sách bị trầy / hư hại."
            });
        }

        const record = await BorrowRecord.findOne({
            _id: borrowRecordId,
            readerId: readerId,
            status: { $in: ["Borrowing", "Overdue", "ReturnPending"] }
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu mượn sách hợp lệ để báo hư sách."
            });
        }

        const [book, reader] = await Promise.all([
            Book.findOne({ bookId: record.bookId }),
            Reader.findOne({ readerId: readerId })
        ]);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin cuốn sách."
            });
        }

        // Đếm số lần vi phạm làm hư sách trước đây của độc giả
        const previousDamagedCount = await Penalty.countDocuments({
            readerId: readerId,
            type: "DAMAGED"
        });

        const occurrence = previousDamagedCount + 1;
        const fineAmount = calculateDamagedFine(occurrence);

        const damageNote = damageType ? `[${damageType}] ` : "";
        const penaltyReason = `${damageNote}${reason || "Sách bị trầy xước / hư hại trong quá trình mượn"} (Làm hư sách lần thứ ${occurrence})`;

        const penalty = new Penalty({
            penaltyId: generatePenaltyId(),
            readerId: readerId,
            bookId: record.bookId,
            borrowRecordId: record._id,
            type: "DAMAGED",
            occurrence: occurrence,
            reason: penaltyReason,
            fineAmount: fineAmount,
            status: "Pending",
            reportedBy: "READER"
        });

        await penalty.save();

        const readerName = reader ? reader.fullName : readerId;
        const formattedFine = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(fineAmount);

        // 1. Thông báo cho Độc giả
        const readerNotification = new Notification({
            target: "READER",
            readerId: readerId,
            title: `Biên bản phạt hư hỏng sách (Lần ${occurrence})`,
            message: `Bạn vừa ghi nhận làm hư/trầy sách "${book.title}" (${record.bookId}) - Vi phạm lần thứ ${occurrence}. Mức phạt áp dụng: ${formattedFine}. Vui lòng nộp phạt cho thư viện.`,
            type: "PENALTY"
        });
        await readerNotification.save();

        // 2. Thông báo cho Admin
        const adminNotification = new Notification({
            target: "ADMIN",
            title: "Độc giả báo làm hư/trầy sách",
            message: `Độc giả ${readerName} (${readerId}) khai báo làm hư/trầy sách "${book.title}" (${record.bookId}) - Lần thứ ${occurrence}. Mức phạt: ${formattedFine}.`,
            type: "PENALTY"
        });
        await adminNotification.save();

        // Real-time broadcast
        sse.sendToReader(readerId, "NOTIFICATION", readerNotification);
        sse.sendToAdmins("NOTIFICATION", adminNotification);

        return res.status(201).json({
            success: true,
            message: `Ghi nhận sách bị hư hỏng thành công (Lần ${occurrence}). Mức phạt áp dụng: ${formattedFine}.`,
            data: penalty
        });
    } catch (error) {
        console.error("Report damaged book error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể xử lý yêu cầu báo hư hỏng sách."
        });
    }
};

// Độc giả thực hiện nộp / thanh toán tiền phạt
module.exports.payPenalty = async (req, res) => {
    try {
        const readerId = req.user.readerId;
        const { id } = req.params;

        const penalty = await Penalty.findOne({
            _id: id,
            readerId: readerId
        });

        if (!penalty) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiếu phạt."
            });
        }

        if (penalty.status === "Paid") {
            return res.status(400).json({
                success: false,
                message: "Khoản phạt này đã được thanh toán trước đó."
            });
        }

        penalty.status = "Paid";
        penalty.paidAt = new Date();
        await penalty.save();

        // Tự động kiểm tra và mở khóa tài khoản độc giả nếu đã thanh toán hết nợ phạt
        await syncReaderAccountLockStatus(readerId);

        const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(penalty.fineAmount);

        // Thông báo xác nhận thanh toán
        const readerNotification = new Notification({
            target: "READER",
            readerId: readerId,
            title: "Nộp phạt thành công",
            message: `Bạn đã hoàn tất nộp khoản phạt ${formattedAmount} cho mã phạt ${penalty.penaltyId}.`,
            type: "SYSTEM"
        });
        await readerNotification.save();

        sse.sendToReader(readerId, "NOTIFICATION", readerNotification);

        return res.status(200).json({
            success: true,
            message: `Đã hoàn tất thanh toán khoản phạt ${formattedAmount}.`,
            data: penalty
        });
    } catch (error) {
        console.error("Pay penalty error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể thanh toán khoản phạt."
        });
    }
};

// Độc giả quét mã QR chuyển khoản và bấm xác nhận đã thanh toán
module.exports.confirmPayment = async (req, res) => {
    try {
        const readerId = req.user.readerId;
        const { id } = req.params;
        const { paymentNote } = req.body;

        const penalty = await Penalty.findOne({
            _id: id,
            readerId: readerId
        });

        if (!penalty) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin biên bản vi phạm."
            });
        }

        if (penalty.status === "Paid") {
            return res.status(400).json({
                success: false,
                message: "Khoản phạt này đã được thanh toán và duyệt thành công trước đó."
            });
        }

        penalty.status = "PaymentPending";
        penalty.paymentMethod = "QR_BANK";
        penalty.paymentNote = (paymentNote || "").trim();
        penalty.paymentSubmittedAt = new Date();
        await penalty.save();

        const [reader, book] = await Promise.all([
            Reader.findOne({ readerId }),
            Book.findOne({ bookId: penalty.bookId })
        ]);

        const readerName = reader ? reader.fullName : readerId;
        const bookTitle = book ? book.title : penalty.bookId;
        const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(penalty.fineAmount);

        // 1. Tạo thông báo cho Độc giả
        const readerNotification = new Notification({
            target: "READER",
            readerId: readerId,
            title: "Đã gửi xác nhận chuyển khoản",
            message: `Hệ thống đã tiếp nhận xác nhận nộp phạt qua mã QR cho biên bản ${penalty.penaltyId} (${formattedAmount}). Vui lòng đợi quản lý thư viện kiểm tra và duyệt thanh toán.`,
            type: "SYSTEM"
        });
        await readerNotification.save();

        // 2. Tạo thông báo cho Admin
        const adminNotification = new Notification({
            target: "ADMIN",
            title: "Yêu cầu duyệt nộp phạt qua mã QR",
            message: `Độc giả ${readerName} (${readerId}) vừa xác nhận chuyển khoản ${formattedAmount} cho mã phạt ${penalty.penaltyId} (Sách: "${bookTitle}"). Vui lòng kiểm tra tài khoản và duyệt thanh toán!`,
            type: "PENALTY"
        });
        await adminNotification.save();

        // SSE Real-time broadcast
        sse.sendToReader(readerId, "NOTIFICATION", readerNotification);
        sse.sendToReader(readerId, "PENALTY_UPDATED", penalty);
        sse.sendToAdmins("NOTIFICATION", adminNotification);
        sse.sendToAdmins("PENALTY_PAYMENT_PENDING", penalty);

        return res.status(200).json({
            success: true,
            message: `Đã gửi xác nhận chuyển khoản cho mã phạt ${penalty.penaltyId}. Quản trị viên thư viện sẽ kiểm tra và duyệt thanh toán cho bạn.`,
            data: penalty
        });

    } catch (error) {
        console.error("Confirm payment error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể gửi xác nhận chuyển khoản."
        });
    }
};

// Độc giả gửi thông báo "Tôi đã tìm lại được cuốn sách này"
module.exports.notifyFoundBook = async (req, res) => {
    try {
        const readerId = req.user.readerId;
        const { penaltyId } = req.body;

        const penalty = await Penalty.findOne({
            penaltyId: penaltyId,
            readerId: readerId,
            type: "LOST"
        });

        if (!penalty) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy biên bản phạt mất sách tương ứng."
            });
        }

        const [book, reader] = await Promise.all([
            Book.findOne({ bookId: penalty.bookId }),
            Reader.findOne({ readerId: readerId })
        ]);

        const bookTitle = book ? book.title : penalty.bookId;
        const readerName = reader ? reader.fullName : readerId;

        // Gửi thông báo đến Admin
        const adminNotice = new Notification({
            target: "ADMIN",
            title: "Độc giả thông báo tìm lại được sách",
            message: `Độc giả ${readerName} (${readerId}) vừa thông báo đã tìm lại được sách "${bookTitle}" (${penalty.bookId}). Khi độc giả mang sách đến quầy, vui lòng kiểm tra thực tế và cập nhật hủy phạt.`,
            type: "RETURN"
        });
        await adminNotice.save();
        sse.sendToAdmins("NOTIFICATION", adminNotice);

        // Gửi thông báo hướng dẫn cho bạn đọc
        const readerNotice = new Notification({
            target: "READER",
            readerId: readerId,
            title: "Yêu cầu tiếp nhận sách tìm lại",
            message: `Hệ thống đã ghi nhận thông báo tìm lại sách "${bookTitle}". Vui lòng mang sách trực tiếp đến quầy thư viện để thủ thư kiểm tra tình trạng và hủy bỏ khoản tiền phạt cho bạn.`,
            type: "SYSTEM"
        });
        await readerNotice.save();
        sse.sendToReader(readerId, "NOTIFICATION", readerNotice);

        return res.status(200).json({
            success: true,
            message: "Đã gửi thông báo tìm lại sách đến nhân viên thư viện. Vui lòng mang sách đến quầy thư viện để được thủ thư kiểm tra và hủy tiền phạt."
        });
    } catch (error) {
        console.error("notifyFoundBook error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể gửi thông báo tìm lại sách."
        });
    }
};
