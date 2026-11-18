const Penalty = require("../models/Penalty.model");
const BorrowRecord = require("../models/BorrowRecord.model");
const Book = require("../models/Book.model");
const Reader = require("../models/Reader.model");
const Notification = require("../models/Notification.model");
const sse = require("./sse.util");

/**
 * Tính mức phạt hư hỏng/trầy sách dựa theo số lần vi phạm:
 * - Lần 1: 0.25$
 * - Lần 2: 0.25 * 2 = 0.50$
 * - Lần 3: 0.5 * 3 = 1.50$
 * - Lần > 3: 1.50$ + (lần - 3) * 0.50$
 */
function calculateDamagedFine(occurrence) {
    if (occurrence <= 1) return 0.25;
    if (occurrence === 2) return 0.50; // 0.25 * 2
    if (occurrence === 3) return 1.50; // 0.5 * 3
    return 1.50 + (occurrence - 3) * 0.50;
}

/**
 * Sinh mã định danh phiếu phạt duy nhất
 */
function generatePenaltyId() {
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PNL-${Date.now().toString(36).toUpperCase()}-${randomStr}`;
}

/**
 * Tự động quét và xử lý cảnh cáo / phạt trễ hạn đối với độc giả:
 * - Lần 1: Cảnh cáo
 * - Lần 2: Cảnh cáo và thông báo nếu lần 3 sẽ phạt 1$
 * - Lần 3 trở đi: Phạt 1$ (1 USD) lưu vào CSDL
 */
async function checkAndApplyOverduePenalties(readerId) {
    try {
        const now = new Date();

        // 1. Tìm các phiếu mượn đang mượn hoặc đã quá hạn của độc giả này
        const overdueRecords = await BorrowRecord.find({
            readerId: readerId,
            status: { $in: ["Borrowing", "Overdue"] },
            dueDate: { $lt: now }
        });

        if (!overdueRecords || overdueRecords.length === 0) {
            return [];
        }

        // Đếm tổng số lần độc giả từng bị trễ hạn (bao gồm các phiếu mượn quá hạn trước đây)
        const totalOverdueCount = await BorrowRecord.countDocuments({
            readerId: readerId,
            $or: [
                { status: "Overdue" },
                { dueDate: { $lt: now }, status: { $in: ["Borrowing", "ReturnPending"] } }
            ]
        });

        const updatedPenalties = [];

        for (const record of overdueRecords) {
            // Cập nhật trạng thái phiếu mượn sang Overdue
            if (record.status !== "Overdue") {
                record.status = "Overdue";
                await record.save();
                sse.sendToReader(readerId, "BORROW_RECORD_UPDATED", record);
            }

            const book = await Book.findOne({ bookId: record.bookId }).select("title bookId price").lean();
            const bookTitle = book ? book.title : record.bookId;

            // Kiểm tra xem phiếu mượn này đã bị lập biên bản phạt OVERDUE chưa
            const existingPenalty = await Penalty.findOne({
                borrowRecordId: record._id,
                type: "OVERDUE"
            });

            if (!existingPenalty) {
                if (totalOverdueCount < 3) {
                    // Lần 1 và Lần 2: Chỉ cảnh cáo qua Notification
                    const warnNotice = await Notification.findOne({
                        target: "READER",
                        readerId: readerId,
                        type: "WARNING",
                        message: { $regex: record.bookId }
                    });

                    if (!warnNotice) {
                        const warning = new Notification({
                            target: "READER",
                            readerId: readerId,
                            title: `Cảnh cáo trễ hạn sách (Lần ${totalOverdueCount})`,
                            message: totalOverdueCount === 1
                                ? `Bạn đang mượn cuốn sách "${bookTitle}" (${record.bookId}) đã quá hạn quy định. Vui lòng hoàn trả sớm.`
                                : `Bạn đang trễ hạn cuốn "${bookTitle}" (${record.bookId}) - Lần thứ 2! Chú ý: Trễ hạn đến lần thứ 3 sẽ bị phạt 1.00$.`,
                            type: "WARNING"
                        });
                        await warning.save();
                        sse.sendToReader(readerId, "NOTIFICATION", warning);
                    }
                } else {
                    // Lần 3 trở lên: Phạt 1.00$ và lưu vào CSDL
                    const penalty = new Penalty({
                        penaltyId: generatePenaltyId(),
                        readerId: readerId,
                        bookId: record.bookId,
                        borrowRecordId: record._id,
                        type: "OVERDUE",
                        occurrence: totalOverdueCount,
                        reason: `Quá hạn trả sách "${bookTitle}" (Vi phạm trễ hạn lần thứ ${totalOverdueCount})`,
                        fineAmount: 1.00, // 1$
                        status: "Pending",
                        reportedBy: "SYSTEM"
                    });
                    await penalty.save();
                    updatedPenalties.push(penalty);

                    // Gửi thông báo phạt
                    const fineNotice = new Notification({
                        target: "READER",
                        readerId: readerId,
                        title: "Thông báo phạt trễ hạn sách (1.00$)",
                        message: `Bạn đã vi phạm trễ hạn lần thứ ${totalOverdueCount} đối với cuốn sách "${bookTitle}" (${record.bookId}). Mức phạt áp dụng là 1.00$. Vui lòng nộp phạt và trả sách.`,
                        type: "PENALTY"
                    });
                    await fineNotice.save();
                    sse.sendToReader(readerId, "NOTIFICATION", fineNotice);
                    sse.sendToAdmins("NOTIFICATION", fineNotice);
                }
            }
        }

        // Kiểm tra xem có biên bản phạt nào đã quá 3 ngày chưa thanh toán (paymentDeadline < now)
        const overduePaymentPenalties = await Penalty.find({
            readerId: readerId,
            status: "Pending",
            paymentDeadline: { $lt: now }
        });

        if (overduePaymentPenalties && overduePaymentPenalties.length > 0) {
            const reader = await Reader.findOne({ readerId: readerId });
            if (reader && reader.status !== "Blocked") {
                reader.status = "Blocked";
                reader.lockReason = `Tài khoản bị khóa tạm thời do quá 3 ngày chưa thanh toán biên bản phạt / bồi hoàn ${overduePaymentPenalties[0].penaltyId}.`;
                reader.lockedAt = new Date();
                await reader.save();

                const formattedAmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(overduePaymentPenalties[0].fineAmount);

                const lockNotice = new Notification({
                    target: "READER",
                    readerId: readerId,
                    title: "TÀI KHOẢN ĐÃ BỊ KHÓA TẠM THỜI (Quá 3 ngày nợ phạt)",
                    message: `Tài khoản của bạn đã bị KHÓA TẠM THỜI do quá 3 ngày chưa thanh toán khoản bồi thường / tiền phạt ${overduePaymentPenalties[0].penaltyId} (${formattedAmt}). Toàn bộ quyền mượn sách mới đã bị tạm dừng. Vui lòng thanh toán khoản phạt tại trang Trả sách để được TỰ ĐỘNG MỞ KHÓA tài khoản!`,
                    type: "PENALTY"
                });
                await lockNotice.save();
                sse.sendToReader(readerId, "NOTIFICATION", lockNotice);
                sse.sendToReader(readerId, "READER_LOCKED", reader);

                const adminLockNotice = new Notification({
                    target: "ADMIN",
                    title: "Tự động khóa tài khoản độc giả do nợ phạt quá 3 ngày",
                    message: `Hệ thống vừa TỰ ĐỘNG KHÓA TẠM THỜI tài khoản của độc giả ${reader.fullName} (${readerId}) do quá thời hạn 3 ngày chưa thanh toán mã phạt ${overduePaymentPenalties[0].penaltyId}.`,
                    type: "SYSTEM"
                });
                await adminLockNotice.save();
                sse.sendToAdmins("NOTIFICATION", adminLockNotice);
            }
        }

        return updatedPenalties;
    } catch (err) {
        console.error("checkAndApplyOverduePenalties error:", err);
        return [];
    }
}

/**
 * Tự động đồng bộ trạng thái mở khóa tài khoản khi độc giả nộp phạt xong
 */
async function syncReaderAccountLockStatus(readerId) {
    try {
        const now = new Date();
        const reader = await Reader.findOne({ readerId });
        if (!reader) return;

        // Đếm số lượng khoản phạt còn đang quá hạn chưa thanh toán
        const overdueDebts = await Penalty.countDocuments({
            readerId,
            status: "Pending",
            paymentDeadline: { $lt: now }
        });

        if (overdueDebts === 0 && reader.status === "Blocked") {
            reader.status = "Active";
            reader.lockReason = "";
            reader.lockedAt = null;
            await reader.save();

            const unlockNotice = new Notification({
                target: "READER",
                readerId,
                title: "MỞ KHÓA TÀI KHOẢN THÀNH CÔNG!",
                message: "Cảm ơn bạn đã hoàn tất thanh toán khoản tiền phạt. Tài khoản độc giả của bạn đã được TỰ ĐỘNG MỞ KHÓA và hoạt động trở lại bình thường!",
                type: "SYSTEM"
            });
            await unlockNotice.save();
            sse.sendToReader(readerId, "NOTIFICATION", unlockNotice);
            sse.sendToReader(readerId, "READER_UNLOCKED", reader);

            const adminNotice = new Notification({
                target: "ADMIN",
                title: "Độc giả được tự động mở khóa tài khoản",
                message: `Độc giả ${reader.fullName} (${readerId}) đã nộp phạt xong, tài khoản đã được TỰ ĐỘNG MỞ KHÓA (Active).`,
                type: "SYSTEM"
            });
            await adminNotice.save();
            sse.sendToAdmins("NOTIFICATION", adminNotice);
        }
    } catch (err) {
        console.error("syncReaderAccountLockStatus error:", err);
    }
}

/**
 * Quét toàn bộ hệ thống để tự động khóa tài khoản độc giả có khoản phạt quá hạn 3 ngày
 */
async function scanAndLockAllOverduePenalties() {
    try {
        const now = new Date();
        const overduePenalties = await Penalty.find({
            status: "Pending",
            paymentDeadline: { $lt: now }
        });

        if (!overduePenalties || overduePenalties.length === 0) return;

        const readerIds = [...new Set(overduePenalties.map(p => p.readerId))];
        for (const readerId of readerIds) {
            await checkAndApplyOverduePenalties(readerId);
        }
    } catch (err) {
        console.error("scanAndLockAllOverduePenalties error:", err);
    }
}

module.exports = {
    calculateDamagedFine,
    generatePenaltyId,
    checkAndApplyOverduePenalties,
    syncReaderAccountLockStatus,
    scanAndLockAllOverduePenalties
};
