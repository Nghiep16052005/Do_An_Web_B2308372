<script>
import ClientBorrowRecordService from "@/services/client/borrowRecord.service";
import ClientAuthService from "@/services/client/auth.service";
import ClientPenaltyService from "@/services/client/penalty.service";

export default {
    name: "ClientReturnBook",

    data() {
        return {
            reader: null,
            borrowingBooks: [],
            returnedRecently: [],
            loading: false,
            returningId: null,
            searchQuery: "",
            successMessage: "",
            errorMessage: "",

            // Quản lý Tab
            activeTab: "borrowing", // "borrowing" hoặc "penalties"

            // Dữ liệu vi phạm & tiền phạt
            penalties: [],
            penaltyStats: null,
            loadingPenalties: false,
            payingPenaltyId: null,

            // Modal Báo mất sách
            showLostModal: false,
            selectedRecordForLost: null,
            lostReason: "",
            submittingLost: false,

            // Modal Báo hỏng / trầy sách
            showDamagedModal: false,
            selectedRecordForDamaged: null,
            damageType: "Trầy xước bìa sách",
            damageReason: "",
            damageEstimate: {
                currentDamagedCount: 0,
                nextOccurrence: 1,
                fineAmount: 0.25
            },
            submittingDamaged: false,

            // Modal Quét mã QR nộp phạt
            showQrModal: false,
            selectedPenaltyForQr: null,
            paymentProofNote: "",
            submittingQrConfirmation: false,
            copiedField: ""
        };
    },

    computed: {
        filteredBooks() {
            if (!this.searchQuery.trim()) {
                return this.borrowingBooks;
            }
            const q = this.searchQuery.toLowerCase();
            return this.borrowingBooks.filter(item => {
                return (
                    item.bookId.toLowerCase().includes(q) ||
                    (item.bookTitle && item.bookTitle.toLowerCase().includes(q)) ||
                    (item.book?.author && item.book.author.toLowerCase().includes(q))
                );
            });
        },

        unpaidPenaltiesCount() {
            return this.penalties.filter(p => p.status === "Pending").length;
        },

        hasOverduePenalties() {
            const now = new Date();
            return this.penalties.some(p => p.status === "Pending" && p.paymentDeadline && new Date(p.paymentDeadline) < now);
        }
    },

    mounted() {
        this.reader = ClientAuthService.getCurrentReader();
        if (this.reader) {
            this.fetchBorrowingBooks();
            this.fetchPenalties();
        }
        window.addEventListener("borrow-record-updated", this.handleDataRefresh);
        window.addEventListener("notification-updated", this.handleDataRefresh);
        window.addEventListener("reader-auth-change", this.handleAuthChange);
        window.addEventListener("penalty-approved", this.handlePenaltyApproved);
        window.addEventListener("penalty-updated", this.handleDataRefresh);
    },

    beforeUnmount() {
        window.removeEventListener("borrow-record-updated", this.handleDataRefresh);
        window.removeEventListener("notification-updated", this.handleDataRefresh);
        window.removeEventListener("reader-auth-change", this.handleAuthChange);
        window.removeEventListener("penalty-approved", this.handlePenaltyApproved);
        window.removeEventListener("penalty-updated", this.handleDataRefresh);
    },

    methods: {
        handleAuthChange() {
            this.reader = ClientAuthService.getCurrentReader();
            if (this.reader) {
                this.fetchBorrowingBooks();
                this.fetchPenalties();
            } else {
                this.borrowingBooks = [];
                this.penalties = [];
            }
        },

        handleDataRefresh() {
            this.fetchBorrowingBooks();
            this.fetchPenalties();
        },

        async fetchBorrowingBooks() {
            this.loading = true;
            this.errorMessage = "";
            try {
                const response = await ClientBorrowRecordService.getMyBorrowRecords();
                if (response.success && response.data) {
                    this.borrowingBooks = response.data.filter(
                        r => r.status === "Borrowing" || r.status === "ReturnPending" || r.status === "Overdue"
                    );
                }
            } catch (error) {
                console.error("Fetch borrowing books error:", error);
                this.errorMessage = "Không thể tải danh sách sách đang mượn.";
            } finally {
                this.loading = false;
            }
        },

        async fetchPenalties() {
            this.loadingPenalties = true;
            try {
                const response = await ClientPenaltyService.getMyPenalties();
                if (response.success) {
                    this.penalties = response.data || [];
                    this.penaltyStats = response.stats || null;
                }
            } catch (error) {
                console.error("Fetch penalties error:", error);
            } finally {
                this.loadingPenalties = false;
            }
        },

        async handleReturnBook(record) {
            const bookTitle = record.bookTitle || record.bookId;
            if (!confirm(`Bạn có chắc chắn muốn gửi yêu cầu trả cuốn sách "${bookTitle}" đến Quản trị viên không?`)) {
                return;
            }

            this.returningId = record._id;
            this.errorMessage = "";
            this.successMessage = "";

            try {
                const response = await ClientBorrowRecordService.returnBook(record._id);
                if (response.success) {
                    this.successMessage = `Đã gửi yêu cầu trả cuốn sách "${bookTitle}" thành công! Vui lòng chờ Quản trị viên kiểm tra và duyệt hoàn tất.`;
                    await this.fetchBorrowingBooks();
                    window.dispatchEvent(new CustomEvent("borrow-record-updated"));
                } else {
                    this.errorMessage = response.message || "Không thể gửi yêu cầu trả sách.";
                }
            } catch (error) {
                console.error("Return book error:", error);
                this.errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi gửi yêu cầu trả sách.";
            } finally {
                this.returningId = null;
            }
        },

        // Mở Modal Báo Mất Sách
        openLostModal(record) {
            this.selectedRecordForLost = record;
            this.lostReason = "";
            this.showLostModal = true;
            this.errorMessage = "";
            this.successMessage = "";
        },

        async submitReportLost() {
            if (!this.selectedRecordForLost) return;

            this.submittingLost = true;
            try {
                const response = await ClientPenaltyService.reportLostBook({
                    borrowRecordId: this.selectedRecordForLost._id,
                    reason: this.lostReason.trim() || "Độc giả báo làm mất sách"
                });

                if (response.success) {
                    this.successMessage = response.message || "Đã ghi nhận báo mất sách và lập biên bản đền bù.";
                    this.showLostModal = false;
                    await this.fetchBorrowingBooks();
                    await this.fetchPenalties();
                    this.activeTab = "penalties"; // Chuyển sang xem danh sách phạt
                    window.dispatchEvent(new CustomEvent("borrow-record-updated"));
                } else {
                    alert(response.message || "Khai báo làm mất sách thất bại.");
                }
            } catch (error) {
                console.error("Report lost error:", error);
                alert(error.response?.data?.message || "Không thể gửi khai báo mất sách.");
            } finally {
                this.submittingLost = false;
            }
        },

        // Mở Modal Báo Trầy / Hư Sách
        async openDamagedModal(record) {
            this.selectedRecordForDamaged = record;
            this.damageType = "Trầy xước bìa sách";
            this.damageReason = "";
            this.showDamagedModal = true;
            this.errorMessage = "";
            this.successMessage = "";

            // Lấy thông tin mức phạt dự kiến theo số lần vi phạm
            try {
                const response = await ClientPenaltyService.getDamageEstimate();
                if (response.success && response.data) {
                    this.damageEstimate = response.data;
                }
            } catch (err) {
                console.error("Get damage estimate error:", err);
            }
        },

        async submitReportDamaged() {
            if (!this.selectedRecordForDamaged) return;

            this.submittingDamaged = true;
            try {
                const response = await ClientPenaltyService.reportDamagedBook({
                    borrowRecordId: this.selectedRecordForDamaged._id,
                    damageType: this.damageType,
                    reason: this.damageReason.trim()
                });

                if (response.success) {
                    this.successMessage = response.message || "Đã ghi nhận báo hư sách thành công.";
                    this.showDamagedModal = false;
                    await this.fetchPenalties();
                    this.activeTab = "penalties"; // Chuyển sang xem biên bản phạt
                    window.dispatchEvent(new CustomEvent("borrow-record-updated"));
                } else {
                    alert(response.message || "Khai báo làm hư sách thất bại.");
                }
            } catch (error) {
                console.error("Report damaged error:", error);
                alert(error.response?.data?.message || "Không thể gửi khai báo hư sách.");
            } finally {
                this.submittingDamaged = false;
            }
        },

        // Mở Modal Quét Mã QR Nộp Phạt
        openQrModal(penalty) {
            this.selectedPenaltyForQr = penalty;
            this.paymentProofNote = "";
            this.copiedField = "";
            this.showQrModal = true;
            this.errorMessage = "";
        },

        formatVND(amountUSD) {
            const vnd = Math.round((amountUSD || 0) * 25400);
            return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(vnd);
        },

        getVietQrUrl(penalty) {
            if (!penalty) return "";
            const amountVnd = Math.round((penalty.fineAmount || 0) * 25400);
            const content = encodeURIComponent("NOPPHAT " + penalty.penaltyId);
            return `https://img.vietqr.io/image/MB-0901234567-compact2.png?amount=${amountVnd}&addInfo=${content}&accountName=THU%20VIEN%20CAN%20THO`;
        },

        getFallbackQrUrl(penalty) {
            if (!penalty) return "";
            const amountVnd = Math.round((penalty.fineAmount || 0) * 25400);
            const content = encodeURIComponent(`MBBank:0901234567|THU VIEN CAN THO|${amountVnd}|NOPPHAT ${penalty.penaltyId}`);
            return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${content}`;
        },

        async copyToClipboard(text, fieldName) {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const textarea = document.createElement("textarea");
                    textarea.value = text;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textarea);
                }
                this.copiedField = fieldName;
                setTimeout(() => { this.copiedField = ""; }, 2500);
            } catch (err) {
                console.error("Copy error:", err);
            }
        },

        async handleConfirmQrPayment() {
            if (!this.selectedPenaltyForQr) return;
            this.submittingQrConfirmation = true;
            try {
                const response = await ClientPenaltyService.confirmQrPayment(
                    this.selectedPenaltyForQr._id,
                    this.paymentProofNote
                );
                if (response.success) {
                    this.successMessage = `Đã gửi xác nhận chuyển khoản cho mã vi phạm "${this.selectedPenaltyForQr.penaltyId}" thành công! Vui lòng chờ quản lý thư viện kiểm tra và duyệt thanh toán.`;
                    this.showQrModal = false;
                    await this.fetchPenalties();
                    window.dispatchEvent(new CustomEvent("notification-updated"));
                } else {
                    alert(response.message || "Xác nhận chuyển khoản thất bại.");
                }
            } catch (error) {
                console.error("Confirm QR payment error:", error);
                alert(error.response?.data?.message || "Không thể gửi xác nhận chuyển khoản.");
            } finally {
                this.submittingQrConfirmation = false;
            }
        },

        handlePenaltyApproved(event) {
            const data = event.detail;
            if (data && data.penaltyId) {
                this.successMessage = `NỘP PHẠT THÀNH CÔNG! Quản lý thư viện vừa duyệt thanh toán cho mã vi phạm "${data.penaltyId}".`;
            }
            this.fetchPenalties();
        },

        // Nộp / Thanh toán tiền phạt trực tiếp (khi cần)
        async handlePayPenalty(penalty) {
            if (!confirm(`Bạn có chắc chắn muốn xác nhận thanh toán khoản phạt ${this.formatCurrency(penalty.fineAmount)} cho mã "${penalty.penaltyId}" không?`)) {
                return;
            }

            this.payingPenaltyId = penalty._id;
            try {
                const response = await ClientPenaltyService.payPenalty(penalty._id);
                if (response.success) {
                    this.successMessage = response.message || "Thanh toán khoản phạt thành công!";
                    await this.fetchPenalties();
                    window.dispatchEvent(new CustomEvent("notification-updated"));
                } else {
                    alert(response.message || "Thanh toán thất bại.");
                }
            } catch (error) {
                console.error("Pay penalty error:", error);
                alert(error.response?.data?.message || "Không thể thanh toán khoản phạt.");
            } finally {
                this.payingPenaltyId = null;
            }
        },

        async handleNotifyFoundBook(penalty) {
            if (!confirm(`Bạn đã tìm lại được cuốn sách "${penalty.bookTitle || penalty.bookId}"? Hãy mang sách đến quầy thư viện để nhân viên kiểm tra thực tế và hủy bỏ khoản tiền phạt này nhé!`)) {
                return;
            }

            try {
                const response = await ClientPenaltyService.notifyFoundBook(penalty.penaltyId);
                if (response.success) {
                    this.successMessage = response.message || "Đã gửi thông báo tìm lại sách đến thủ thư thành công!";
                    await this.fetchPenalties();
                } else {
                    alert(response.message || "Không thể gửi thông báo.");
                }
            } catch (error) {
                console.error("Notify found book error:", error);
                alert("Đã xảy ra lỗi khi gửi thông báo tìm lại sách.");
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return "-";
            return new Date(dateStr).toLocaleDateString("vi-VN");
        },

        formatCurrency(amount) {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2
            }).format(amount || 0);
        },

        isOverdue(dueDateStr) {
            if (!dueDateStr) return false;
            return new Date(dueDateStr) < new Date();
        },

        getBookImage(image) {
            if (!image) return "/images/default-book.svg";
            if (image.startsWith("http://") || image.startsWith("https://")) return image;
            if (image.startsWith("/")) return image;
            return `/images/${image}`;
        },

        handleImageError(event) {
            event.target.src = "/images/default-book.svg";
        }
    }
};
</script>

<template>
    <div class="py-3">
        <!-- Header Banner -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
            <div>
                <h2 class="font-weight-bold text-dark mb-1">
                    <i class="fas fa-book-reader text-primary mr-2"></i> Quản Lý Mượn Trả & Xử Lý Vi Phạm
                </h2>
                <p class="text-muted mb-0">
                    Theo dõi sách đang mượn, yêu cầu hoàn trả sách, khai báo sách bị mất/hư hỏng và tra cứu biên bản phạt.
                </p>
            </div>
            <div class="mt-3 mt-md-0 d-flex align-items-center">
                <router-link :to="{ name: 'admin-borrow-records' }" class="btn btn-outline-dark btn-sm mr-2 shadow-sm font-weight-semibold" title="Chuyển sang Cổng Quản lý Thủ thư để thực hiện kiểm tra sách tại quầy">
                    <i class="fas fa-user-shield text-primary mr-1"></i> Cổng Thủ thư (Quản lý)
                </router-link>
                <router-link :to="{ name: 'client-borrow-records' }" class="btn btn-outline-primary btn-sm mr-2 shadow-sm font-weight-semibold">
                    <i class="fas fa-history mr-1"></i> Lịch sử mượn
                </router-link>
                <button class="btn btn-light border btn-sm shadow-sm" @click="handleDataRefresh" :disabled="loading">
                    <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i> Làm mới
                </button>
            </div>
        </div>

        <!-- Thông báo nổi bật -->
        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show shadow-sm border-0 py-3" style="background-color: #d1fae5; color: #065f46; border-radius: 10px;">
            <div class="d-flex align-items-center">
                <i class="fas fa-check-circle fa-2x mr-3 text-success"></i>
                <div>
                    <h5 class="font-weight-bold mb-1">Thao tác thành công!</h5>
                    <div>{{ successMessage }}</div>
                </div>
            </div>
            <button type="button" class="close" @click="successMessage = ''">&times;</button>
        </div>

        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show shadow-sm border-0 py-3 mb-4" style="border-radius: 10px;">
            <i class="fas fa-exclamation-triangle mr-2"></i> {{ errorMessage }}
            <button type="button" class="close" @click="errorMessage = ''">&times;</button>
        </div>

        <!-- Cảnh báo quy định vi phạm & Mức phạt -->
        <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px; background: linear-gradient(to right, #eff6ff, #f8fafc); border-left: 5px solid #2563eb !important;">
            <div class="card-body p-3">
                <div class="row align-items-center">
                    <div class="col-lg-8">
                        <h6 class="font-weight-bold text-dark mb-1">
                            <i class="fas fa-gavel text-primary mr-1"></i> Quy định xử lý vi phạm mượn sách:
                        </h6>
                        <ul class="mb-0 pl-3 small text-muted">
                            <li><strong>Trễ hạn:</strong> Quá hạn lần 1 & 2 được <em>Cảnh cáo</em> nhắc nhở. Trễ hạn đến <strong>lần thứ 3</strong> áp dụng mức phạt <strong>1.00$</strong>.</li>
                            <li><strong>Làm hư / trầy sách:</strong> Lần 1: <strong>0.25$</strong> | Lần 2: <strong>0.50$</strong> (0.25$ &times; 2) | Lần 3: <strong>1.50$</strong> (0.50$ &times; 3).</li>
                            <li><strong>Làm mất sách:</strong> Khai báo form mẫu và bồi thường <strong>đúng 100% giá tiền niêm yết trên bìa sách</strong>.</li>
                        </ul>
                    </div>
                    <div class="col-lg-4 text-lg-right mt-3 mt-lg-0" v-if="penaltyStats">
                        <div class="d-inline-block text-left p-2 bg-white rounded border shadow-sm small">
                            <div><span class="text-muted">Tiền phạt cần nộp:</span> <strong class="text-danger font-weight-bold">{{ formatCurrency(penaltyStats.totalPendingAmount) }}</strong></div>
                            <div><span class="text-muted">Lần làm hư sách:</span> <strong>{{ penaltyStats.damagedCount }} lần</strong></div>
                            <div><span class="text-muted">Lần trễ hạn:</span> <strong>{{ penaltyStats.overdueCount }} lần</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab Điều hướng: Sách đang mượn vs Biên lai Vi phạm & Tiền phạt -->
        <ul class="nav nav-pills mb-4 border-bottom pb-2">
            <li class="nav-item mr-2">
                <button 
                    class="nav-link px-4 py-2 font-weight-bold" 
                    :class="{ 'active bg-primary text-white shadow-sm': activeTab === 'borrowing', 'btn-light text-dark': activeTab !== 'borrowing' }"
                    @click="activeTab = 'borrowing'"
                >
                    <i class="fas fa-book mr-1"></i> Sách đang mượn ({{ borrowingBooks.length }})
                </button>
            </li>
            <li class="nav-item">
                <button 
                    class="nav-link px-4 py-2 font-weight-bold position-relative" 
                    :class="{ 'active bg-danger text-white shadow-sm': activeTab === 'penalties', 'btn-light text-dark': activeTab !== 'penalties' }"
                    @click="activeTab = 'penalties'"
                >
                    <i class="fas fa-file-invoice-dollar mr-1"></i> Biên lai Vi phạm & Tiền phạt
                    <span v-if="unpaidPenaltiesCount > 0" class="badge badge-pill badge-warning text-dark ml-2">
                        {{ unpaidPenaltiesCount }} chưa nộp
                    </span>
                </button>
            </li>
        </ul>

        <!-- ==================== TAB 1: SÁCH ĐANG MƯỢN ==================== -->
        <div v-if="activeTab === 'borrowing'">
            <!-- Ô tìm kiếm nhanh -->
            <div class="row mb-4">
                <div class="col-md-6 mb-3 mb-md-0">
                    <div class="d-flex align-items-center p-3 bg-white rounded shadow-sm border">
                        <div class="avatar-circle mr-3 bg-primary-light text-primary" style="width: 46px; height: 46px; font-size: 1.25rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #e0f2fe;">
                            <i class="fas fa-id-card"></i>
                        </div>
                        <div>
                            <span class="text-muted small d-block">Độc giả mượn sách:</span>
                            <strong class="text-dark">{{ reader?.fullName }} ({{ reader?.readerId }})</strong>
                        </div>
                        <div class="ml-auto text-right">
                            <span class="badge badge-primary px-3 py-2 font-weight-bold" style="font-size: 0.85rem;">
                                {{ borrowingBooks.length }} cuốn đang giữ
                            </span>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="input-group h-100 shadow-sm">
                        <div class="input-group-prepend">
                            <span class="input-group-text bg-white border-right-0"><i class="fas fa-search text-muted"></i></span>
                        </div>
                        <input 
                            v-model="searchQuery" 
                            type="text" 
                            class="form-control border-left-0" 
                            placeholder="Lọc nhanh sách theo mã sách, tên sách hoặc tác giả..." 
                        />
                    </div>
                </div>
            </div>

            <!-- Loading Spinner -->
            <div v-if="loading && borrowingBooks.length === 0" class="text-center py-5">
                <div class="spinner-border text-primary spinner-border-lg"></div>
                <p class="mt-2 text-muted">Đang tải danh sách sách đang mượn...</p>
            </div>

            <!-- Không có sách nào đang mượn -->
            <div v-else-if="borrowingBooks.length === 0" class="card shadow-sm border-0 p-5 text-center my-4" style="border-radius: 16px;">
                <div class="avatar-circle mx-auto mb-3 text-success" style="width: 70px; height: 70px; font-size: 2.2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #dcfce7;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h4 class="font-weight-bold text-dark mb-2">Bạn không có sách nào đang mượn cần hoàn trả!</h4>
                <p class="text-muted mb-4" style="max-width: 480px; margin: 0 auto;">
                    Tất cả các đầu sách bạn mượn đã được hoàn trả thành công hoặc bạn chưa đăng ký mượn sách mới.
                </p>
                <div>
                    <router-link :to="{ name: 'client-books' }" class="btn btn-primary px-4 shadow-sm font-weight-bold">
                        <i class="fas fa-book mr-2"></i> Khám phá kho sách & Mượn sách
                    </router-link>
                </div>
            </div>

            <!-- Danh sách sách đang mượn -->
            <div v-else class="row">
                <div 
                    v-for="record in filteredBooks" 
                    :key="record._id" 
                    class="col-sm-6 col-md-6 col-lg-4 col-xl-3 mb-4"
                >
                    <div class="card h-100 shadow-sm border-0 return-card position-relative" style="border-radius: 14px; overflow: hidden;">
                        <!-- Trạng thái badge -->
                        <div v-if="record.status === 'ReturnPending'" class="position-absolute" style="top: 10px; right: 10px; z-index: 2;">
                            <span class="badge badge-warning text-dark px-2 py-1 shadow-sm font-weight-bold">
                                <i class="fas fa-clock mr-1"></i> Chờ duyệt trả
                            </span>
                        </div>
                        <div v-else-if="record.status === 'Overdue' || isOverdue(record.dueDate)" class="position-absolute" style="top: 10px; right: 10px; z-index: 2;">
                            <span class="badge badge-danger px-2 py-1 shadow-sm font-weight-bold">
                                <i class="fas fa-exclamation-circle mr-1"></i> Quá hạn
                            </span>
                        </div>

                        <div class="card-body p-3 d-flex flex-column">
                            <div class="d-flex mb-3">
                                <div class="book-thumbnail mr-3 shadow-sm rounded overflow-hidden" style="width: 75px; height: 105px; flex-shrink: 0; background: #f1f5f9;">
                                    <img 
                                        :src="getBookImage(record.book?.image)" 
                                        :alt="record.bookTitle" 
                                        class="w-100 h-100" 
                                        style="object-fit: cover;"
                                        @error="handleImageError"
                                    />
                                </div>
                                <div class="flex-grow-1 overflow-hidden">
                                    <span class="badge badge-light border text-primary font-weight-bold mb-1">
                                        {{ record.bookId }}
                                    </span>
                                    <h6 class="font-weight-bold text-dark text-truncate mb-1" :title="record.bookTitle">
                                        {{ record.bookTitle || record.bookId }}
                                    </h6>
                                    <div class="text-muted small text-truncate mb-1" v-if="record.book?.author">
                                        <i class="fas fa-user-edit mr-1"></i> {{ record.book.author }}
                                    </div>
                                    <div class="small">
                                        <span class="text-muted">Giá bìa:</span> 
                                        <strong class="text-primary">{{ formatCurrency(record.book?.price) }}</strong>
                                    </div>
                                </div>
                            </div>

                            <div class="p-2 rounded mb-3 small" :class="isOverdue(record.dueDate) ? 'bg-danger-light text-danger' : 'bg-light text-dark'" style="background: #f8fafc;">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span><i class="fas fa-calendar-alt mr-1"></i> Hạn trả:</span>
                                    <strong :class="{ 'text-danger font-weight-bold': isOverdue(record.dueDate) }">
                                        {{ formatDate(record.dueDate) }}
                                    </strong>
                                </div>
                            </div>

                            <!-- Nhóm nút hành động: Trả sách, Báo hư/trầy, Báo mất -->
                            <div class="mt-auto">
                                <div v-if="record.status === 'ReturnPending'">
                                    <button class="btn btn-warning text-dark btn-block py-2 font-weight-bold shadow-sm" disabled>
                                        <i class="fas fa-hourglass-half mr-1"></i> Đang chờ Admin duyệt
                                    </button>
                                </div>

                                <div v-else class="action-buttons-group">
                                    <!-- Nút 1: Yêu cầu trả sách bình thường -->
                                    <button 
                                        class="btn btn-success btn-block py-2 font-weight-bold shadow-sm mb-2"
                                        :disabled="returningId === record._id"
                                        @click="handleReturnBook(record)"
                                        title="Hoàn trả sách nguyên vẹn"
                                    >
                                        <span v-if="returningId === record._id" class="spinner-border spinner-border-sm mr-1"></span>
                                        <i v-else class="fas fa-undo-alt mr-1"></i>
                                        Trả sách bình thường
                                    </button>

                                    <!-- Nút 2 & 3: Báo hỏng / Báo mất sách -->
                                    <div class="d-flex justify-content-between">
                                        <button 
                                            class="btn btn-outline-warning btn-sm font-weight-semibold flex-fill mr-1 text-dark"
                                            @click="openDamagedModal(record)"
                                            title="Khai báo sách bị trầy xước, rách trang hoặc hư hại"
                                        >
                                            <i class="fas fa-tools mr-1 text-warning"></i> Báo trầy/hư
                                        </button>
                                        <button 
                                            class="btn btn-outline-danger btn-sm font-weight-semibold flex-fill ml-1"
                                            @click="openLostModal(record)"
                                            title="Khai báo làm mất sách & đền bù giá bìa"
                                        >
                                            <i class="fas fa-times-circle mr-1"></i> Báo mất sách
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== TAB 2: BIÊN BẢN VI PHẠM & TIỀN PHẠT ==================== -->
        <div v-else-if="activeTab === 'penalties'">
            <div v-if="loadingPenalties" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2 text-muted">Đang tải danh sách biên bản phạt...</p>
            </div>

            <div v-else-if="penalties.length === 0" class="card shadow-sm border-0 p-5 text-center my-4" style="border-radius: 16px;">
                <div class="avatar-circle mx-auto mb-3 text-success" style="width: 70px; height: 70px; font-size: 2.2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #dcfce7;">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h4 class="font-weight-bold text-dark mb-2">Bạn không có biên bản vi phạm hay khoản phạt nào!</h4>
                <p class="text-muted mb-0">Cảm ơn bạn đã luôn giữ gìn sách và hoàn trả tài liệu đúng hạn.</p>
            </div>

            <div v-else>
                <!-- Cảnh báo nếu có khoản phạt quá hạn nộp (Quá 3 ngày) -->
                <div v-if="hasOverduePenalties" class="alert alert-danger shadow-sm border-0 py-3 mb-3" style="border-radius: 10px; background-color: #fee2e2; color: #991b1b;">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-user-lock fa-2x mr-3 text-danger"></i>
                        <div>
                            <h6 class="font-weight-bold mb-1">CẢNH BÁO: TÀI KHOẢN ĐÃ BỊ KHÓA TẠM THỜI (QUÁ HẠN 3 NGÀY CHƯA NỘP PHẠT)!</h6>
                            <p class="small mb-0">Bạn có biên bản vi phạm / bồi hoàn đã quá thời hạn 3 ngày quy định chưa thanh toán. Tài khoản của bạn đã bị <strong>KHÓA TẠM THỜI</strong> và không thể đăng ký mượn sách mới. Vui lòng bấm <strong>"Nộp phạt"</strong> dưới đây để hệ thống <strong>TỰ ĐỘNG MỞ KHÓA</strong> tài khoản ngay lập tức!</p>
                        </div>
                    </div>
                </div>

                <div class="card shadow-sm border-0 mb-4" style="border-radius: 12px; overflow: hidden;">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="bg-light">
                                <tr>
                                    <th>Mã phiếu phạt</th>
                                    <th>Cuốn sách</th>
                                    <th>Loại vi phạm</th>
                                    <th>Chi tiết / Lý do & Hạn nộp</th>
                                    <th>Số tiền phạt</th>
                                    <th>Trạng thái</th>
                                    <th class="text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="p in penalties" :key="p._id">
                                    <td class="font-weight-bold text-monospace text-dark">
                                        {{ p.penaltyId }}
                                    </td>
                                    <td>
                                        <div class="font-weight-bold text-dark">{{ p.bookTitle || p.bookId }}</div>
                                        <small class="text-muted">Mã sách: {{ p.bookId }}</small>
                                    </td>
                                    <td>
                                        <span v-if="p.type === 'OVERDUE'" class="badge badge-danger px-2 py-1">
                                            <i class="fas fa-clock mr-1"></i> Trễ hạn (Lần {{ p.occurrence }})
                                        </span>
                                        <span v-else-if="p.type === 'DAMAGED' && (p.severity === 'UNRECOVERABLE' || p.severity === 'HEAVY')" class="badge badge-danger px-2 py-1">
                                            <i class="fas fa-times-circle mr-1"></i> Hư hỏng nặng (Đền 100% bìa)
                                        </span>
                                        <span v-else-if="p.type === 'DAMAGED'" class="badge badge-warning text-dark px-2 py-1">
                                            <i class="fas fa-tools mr-1"></i> Hư/Trầy sách (Lần {{ p.occurrence }})
                                        </span>
                                        <span v-else-if="p.type === 'LOST'" class="badge badge-dark px-2 py-1">
                                            <i class="fas fa-exclamation-triangle mr-1"></i> Làm mất sách
                                        </span>
                                    </td>
                                    <td>
                                        <div class="small text-dark font-weight-semibold">{{ p.reason }}</div>
                                        <small class="text-muted d-block">Tạo lúc: {{ formatDate(p.createdAt) }}</small>
                                        
                                        <!-- Hạn chót thanh toán -->
                                        <div v-if="p.status === 'Pending' && p.paymentDeadline" class="mt-1">
                                            <span v-if="new Date(p.paymentDeadline) < new Date()" class="badge badge-danger px-2 py-1" style="font-size: 0.75rem;">
                                                <i class="fas fa-exclamation-circle mr-1"></i> ĐÃ QUÁ HẠN (Hạn: {{ formatDate(p.paymentDeadline) }})
                                            </span>
                                            <span v-else class="text-muted small" style="font-size: 0.78rem;">
                                                <i class="far fa-calendar-alt mr-1 text-primary"></i> Hạn chót nộp: <strong>{{ formatDate(p.paymentDeadline) }}</strong>
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="font-weight-bold text-danger" style="font-size: 1.05rem;">
                                            {{ formatCurrency(p.fineAmount) }}
                                        </span>
                                    </td>
                                    <td>
                                        <span v-if="p.status === 'Paid'" class="badge badge-success px-2 py-1">
                                            <i class="fas fa-check-circle mr-1"></i> Đã nộp phạt
                                        </span>
                                        <span v-else-if="p.status === 'PaymentPending'" class="badge badge-warning text-dark px-2 py-1 font-weight-bold" style="background-color: #fef08a; border: 1px solid #eab308;">
                                            <i class="fas fa-hourglass-half mr-1 text-warning"></i> Chờ duyệt thanh toán
                                        </span>
                                        <span v-else-if="p.status === 'Pending'" class="badge badge-danger px-2 py-1">
                                            <i class="fas fa-clock mr-1"></i> Chưa nộp
                                        </span>
                                        <span v-else-if="p.status === 'Cancelled'" class="badge badge-secondary px-2 py-1" :title="p.cancellationReason">
                                            <i class="fas fa-undo mr-1"></i> Đã hủy
                                        </span>
                                        <span v-else class="badge badge-secondary px-2 py-1">
                                            {{ p.status }}
                                        </span>
                                        <div v-if="p.paymentNote" class="small text-muted font-italic mt-1" style="max-width: 180px;">
                                            {{ p.paymentNote }}
                                        </div>
                                        <div v-else-if="p.cancellationReason" class="small text-muted font-italic mt-1" style="max-width: 180px;">
                                            {{ p.cancellationReason }}
                                        </div>
                                    </td>
                                    <td class="text-center text-nowrap">
                                        <template v-if="p.status === 'Pending'">
                                            <button 
                                                class="btn btn-primary btn-sm px-2 px-md-3 shadow-sm font-weight-bold mb-1"
                                                title="Quét mã QR để chuyển khoản nộp phạt"
                                                @click="openQrModal(p)"
                                            >
                                                <i class="fas fa-qrcode mr-1"></i> Nộp phạt (Mã QR)
                                            </button>

                                            <!-- Độc giả báo tìm lại sách đối với loại LOST -->
                                            <button 
                                                v-if="p.type === 'LOST'"
                                                class="btn btn-outline-success btn-sm font-weight-semibold shadow-sm d-block w-100 mt-1"
                                                style="font-size: 0.78rem;"
                                                title="Báo cho thư viện biết bạn đã tìm lại được sách để được huỷ tiền phạt"
                                                @click="handleNotifyFoundBook(p)"
                                            >
                                                <i class="fas fa-search-plus mr-1"></i> Đã tìm lại sách
                                            </button>
                                        </template>

                                        <template v-else-if="p.status === 'PaymentPending'">
                                            <span class="badge badge-light border text-muted px-2 py-1 d-block mb-1" style="font-size: 0.76rem;">
                                                <i class="fas fa-clock mr-1 text-warning"></i> Đang chờ thủ thư duyệt
                                            </span>
                                            <button 
                                                class="btn btn-link btn-sm text-primary p-0 font-weight-semibold" 
                                                style="font-size: 0.78rem;"
                                                @click="openQrModal(p)"
                                            >
                                                <i class="fas fa-eye mr-1"></i> Xem lại QR
                                            </button>
                                        </template>

                                        <template v-else-if="p.status === 'Paid'">
                                            <span class="text-success small font-weight-bold">
                                                <i class="fas fa-check-double mr-1"></i> Đã hoàn tất
                                            </span>
                                        </template>

                                        <template v-else-if="p.status === 'Cancelled'">
                                            <span class="text-muted small font-weight-bold">
                                                <i class="fas fa-ban mr-1"></i> Đã hủy
                                            </span>
                                        </template>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== MODAL FORM 1: BÁO MẤT SÁCH & ĐỀN BÙ GIÁ BÌA ==================== -->
        <div v-if="showLostModal" class="modal-backdrop fade show" style="z-index: 1040;"></div>
        <div v-if="showLostModal" class="modal fade show d-block" tabindex="-1" style="z-index: 1050;">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 480px; max-height: 90vh;">
                <div class="modal-content shadow-lg border-0" style="border-radius: 12px; max-height: 88vh;">
                    <div class="modal-header bg-danger text-white py-2 px-3">
                        <h6 class="modal-title font-weight-bold mb-0">
                            <i class="fas fa-exclamation-triangle mr-2"></i> Khai Báo Làm Mất Sách & Đền Bù
                        </h6>
                        <button type="button" class="close text-white p-2" @click="showLostModal = false">&times;</button>
                    </div>

                    <form @submit.prevent="submitReportLost">
                        <div class="modal-body p-3">
                            <!-- Thông tin sách bị mất -->
                            <div class="d-flex align-items-center p-2 bg-light rounded border mb-2">
                                <div class="mr-2" style="width: 42px; height: 56px; background: #e2e8f0; border-radius: 4px; overflow: hidden; flex-shrink: 0;">
                                    <img :src="getBookImage(selectedRecordForLost?.book?.image)" class="w-100 h-100" style="object-fit: cover;">
                                </div>
                                <div class="flex-grow-1 overflow-hidden">
                                    <h6 class="font-weight-bold text-dark text-truncate mb-0 small">
                                        {{ selectedRecordForLost?.bookTitle || selectedRecordForLost?.bookId }}
                                    </h6>
                                    <div class="text-muted" style="font-size: 0.78rem;">Mã: <strong>{{ selectedRecordForLost?.bookId }}</strong> | Hạn trả: {{ formatDate(selectedRecordForLost?.dueDate) }}</div>
                                </div>
                            </div>

                            <!-- Mức đền bù theo giá niêm yết trên bìa -->
                            <div class="alert alert-warning border-0 p-2 mb-2" style="border-radius: 8px; background-color: #fef3c7;">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="font-weight-bold text-dark small"><i class="fas fa-tag mr-1"></i> Giá niêm yết bìa sách:</span>
                                    <span class="h5 font-weight-bold text-danger mb-0">
                                        {{ formatCurrency(selectedRecordForLost?.book?.price) }}
                                    </span>
                                </div>
                                <small class="text-muted d-block mt-1" style="font-size: 0.76rem;">
                                    Độc giả làm mất sách phải đền bù <strong>đúng 100% số tiền niêm yết</strong> ghi trên bìa sách.
                                </small>
                            </div>

                            <div class="form-group mb-2">
                                <label class="font-weight-bold small text-muted mb-1">Lý do / Hoàn cảnh làm mất sách <span class="text-danger">*</span></label>
                                <textarea 
                                    v-model="lostReason" 
                                    class="form-control form-control-sm" 
                                    rows="2" 
                                    placeholder="Ví dụ: Bị thất lạc tại phòng tự học, để quên trên xe..."
                                    required
                                ></textarea>
                            </div>

                            <div class="custom-control custom-checkbox small">
                                <input type="checkbox" class="custom-control-input" id="agreeLostCompensate" required>
                                <label class="custom-control-label text-muted" for="agreeLostCompensate" style="font-size: 0.78rem;">
                                    Tôi cam kết thông tin trên là chính xác và đồng ý đền bù đúng số tiền <strong>{{ formatCurrency(selectedRecordForLost?.book?.price) }}</strong>.
                                </label>
                            </div>
                        </div>

                        <div class="modal-footer bg-light border-top py-2 px-3">
                            <button type="button" class="btn btn-secondary btn-sm px-3" @click="showLostModal = false">
                                Đóng
                            </button>
                            <button type="submit" class="btn btn-danger btn-sm px-3 font-weight-bold shadow-sm" :disabled="submittingLost">
                                <span v-if="submittingLost" class="spinner-border spinner-border-sm mr-1"></span>
                                <i v-else class="fas fa-check mr-1"></i> Xác nhận đền bù giá bìa
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- ==================== MODAL FORM 2: BÁO HỎNG / TRẦY SÁCH (LŨY TIẾN) ==================== -->
        <div v-if="showDamagedModal" class="modal-backdrop fade show" style="z-index: 1040;"></div>
        <div v-if="showDamagedModal" class="modal fade show d-block" tabindex="-1" style="z-index: 1050;">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 480px; max-height: 90vh;">
                <div class="modal-content shadow-lg border-0" style="border-radius: 12px; max-height: 88vh;">
                    <div class="modal-header bg-warning text-dark py-2 px-3">
                        <h6 class="modal-title font-weight-bold mb-0">
                            <i class="fas fa-tools mr-2 text-danger"></i> Khai Báo Sách Bị Trầy Xước / Hư Hỏng
                        </h6>
                        <button type="button" class="close p-2" @click="showDamagedModal = false">&times;</button>
                    </div>

                    <form @submit.prevent="submitReportDamaged">
                        <div class="modal-body p-3">
                            <!-- Sách hư hỏng -->
                            <div class="d-flex align-items-center p-2 bg-light rounded border mb-2">
                                <div class="mr-2" style="width: 42px; height: 56px; background: #e2e8f0; border-radius: 4px; overflow: hidden; flex-shrink: 0;">
                                    <img :src="getBookImage(selectedRecordForDamaged?.book?.image)" class="w-100 h-100" style="object-fit: cover;">
                                </div>
                                <div class="flex-grow-1 overflow-hidden">
                                    <h6 class="font-weight-bold text-dark text-truncate mb-0 small">
                                        {{ selectedRecordForDamaged?.bookTitle || selectedRecordForDamaged?.bookId }}
                                    </h6>
                                    <div class="text-muted" style="font-size: 0.78rem;">Mã: <strong>{{ selectedRecordForDamaged?.bookId }}</strong></div>
                                </div>
                            </div>

                            <!-- Bảng tính mức phạt lũy tiến theo số lần vi phạm -->
                            <div class="p-2 bg-light rounded border mb-2">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="small text-muted">Số lần từng làm hư:</span>
                                    <span class="badge badge-secondary px-2 py-0">{{ damageEstimate.currentDamagedCount }} lần</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="font-weight-bold text-dark small">Lần vi phạm này:</span>
                                    <span class="badge badge-danger px-2 py-0 font-weight-bold">
                                        Lần thứ {{ damageEstimate.nextOccurrence }}
                                    </span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center pt-1 border-top">
                                    <span class="font-weight-bold text-dark small">Mức phạt quy định:</span>
                                    <span class="h5 font-weight-bold text-danger mb-0">
                                        {{ formatCurrency(damageEstimate.fineAmount) }}
                                    </span>
                                </div>
                                <div class="small text-muted mt-1 pt-1 border-top" style="font-size: 0.74rem;">
                                    <strong>Khung lũy tiến:</strong> Lần 1: 0.25$ &bull; Lần 2: 0.50$ &bull; Lần 3: 1.50$
                                </div>
                            </div>

                            <div class="form-group mb-2">
                                <label class="font-weight-bold small text-muted mb-1">Dạng hư hỏng / trầy xước <span class="text-danger">*</span></label>
                                <select v-model="damageType" class="form-control form-control-sm" required>
                                    <option value="Trầy xước bìa sách">Trầy xước bìa sách</option>
                                    <option value="Rách hoặc gấp nếp trang sách">Rách hoặc gấp nếp trang sách</option>
                                    <option value="Vẽ bẩn / Gạch mực lên trang">Vẽ bẩn / Gạch mực lên trang</option>
                                    <option value="Thấm nước / Ẩm ướt">Thấm nước / Ẩm ướt</option>
                                    <option value="Bong gáy sách">Bong gáy sách</option>
                                    <option value="Khác">Hư hỏng khác</option>
                                </select>
                            </div>

                            <div class="form-group mb-2">
                                <label class="font-weight-bold small text-muted mb-1">Mô tả chi tiết tình trạng</label>
                                <textarea 
                                    v-model="damageReason" 
                                    class="form-control form-control-sm" 
                                    rows="2" 
                                    placeholder="Mô tả mức độ trầy xước, số trang..."
                                ></textarea>
                            </div>

                            <div class="custom-control custom-checkbox small">
                                <input type="checkbox" class="custom-control-input" id="agreeDamageFine" required>
                                <label class="custom-control-label text-muted" for="agreeDamageFine" style="font-size: 0.78rem;">
                                    Tôi cam kết thông tin là chính xác và chấp nhận nộp mức phạt <strong>{{ formatCurrency(damageEstimate.fineAmount) }}</strong>.
                                </label>
                            </div>
                        </div>

                        <div class="modal-footer bg-light border-top py-2 px-3">
                            <button type="button" class="btn btn-secondary btn-sm px-3" @click="showDamagedModal = false">
                                Đóng
                            </button>
                            <button type="submit" class="btn btn-warning btn-sm px-3 font-weight-bold shadow-sm text-dark" :disabled="submittingDamaged">
                                <span v-if="submittingDamaged" class="spinner-border spinner-border-sm mr-1"></span>
                                <i v-else class="fas fa-check mr-1"></i> Xác nhận & Gửi biên lai
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Modal Quét Mã QR Nộp Phạt -->
        <div v-if="showQrModal && selectedPenaltyForQr" class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.65); z-index: 1055;">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 520px; max-height: 94vh;">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <div class="modal-header text-white py-3" style="background: linear-gradient(135deg, #1e3a8a, #2563eb);">
                        <div class="d-flex align-items-center">
                            <div class="bg-white rounded-circle p-2 text-primary mr-3 shadow-sm" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-qrcode" style="font-size: 1.25rem;"></i>
                            </div>
                            <div>
                                <h5 class="modal-title font-weight-bold mb-0 text-white">Quét Mã QR Nộp Phạt</h5>
                                <span class="small text-white-50">Thanh toán chuyển khoản 24/7 qua VietQR</span>
                            </div>
                        </div>
                        <button type="button" class="close text-white" @click="showQrModal = false">&times;</button>
                    </div>

                    <!-- Body -->
                    <div class="modal-body p-4 bg-light">
                        <!-- Thông tin khoản phạt tóm tắt -->
                        <div class="card border-0 shadow-xs mb-3" style="border-radius: 12px; background: #ffffff;">
                            <div class="card-body p-3">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <span class="badge badge-secondary mb-1">Mã: {{ selectedPenaltyForQr.penaltyId }}</span>
                                        <h6 class="font-weight-bold text-dark mb-0">{{ selectedPenaltyForQr.bookTitle || selectedPenaltyForQr.bookId }}</h6>
                                    </div>
                                    <div class="text-right">
                                        <span class="d-block text-danger font-weight-bold" style="font-size: 1.25rem;">
                                            {{ formatCurrency(selectedPenaltyForQr.fineAmount) }}
                                        </span>
                                        <span class="text-muted font-weight-semibold" style="font-size: 0.82rem;">
                                            &asymp; {{ formatVND(selectedPenaltyForQr.fineAmount) }}
                                        </span>
                                    </div>
                                </div>
                                <div class="small text-muted border-top pt-2">
                                    <i class="fas fa-info-circle text-primary mr-1"></i>
                                    <strong>Lý do:</strong> {{ selectedPenaltyForQr.reason }}
                                </div>
                            </div>
                        </div>

                        <!-- Khung Mã QR VietQR -->
                        <div class="text-center p-3 bg-white rounded shadow-sm mb-3 border">
                            <div class="font-weight-bold text-primary mb-2">
                                <i class="fas fa-camera mr-1"></i> Quét mã bằng App Ngân Hàng hoặc MoMo
                            </div>

                            <div class="d-flex justify-content-center my-2">
                                <div class="p-2 border rounded shadow-xs bg-white" style="display: inline-block;">
                                    <img 
                                        :src="getVietQrUrl(selectedPenaltyForQr)" 
                                        :alt="'QR nộp phạt ' + selectedPenaltyForQr.penaltyId" 
                                        class="img-fluid rounded"
                                        style="max-width: 230px; height: auto;"
                                        @error="$event.target.src = getFallbackQrUrl(selectedPenaltyForQr)"
                                    />
                                </div>
                            </div>
                            <small class="text-muted d-block mt-1 font-italic">
                                <i class="fas fa-shield-alt text-success mr-1"></i> Mã QR tự động điền đúng số tiền và nội dung chuyển khoản
                            </small>
                        </div>

                        <!-- Chi tiết tài khoản ngân hàng để sao chép -->
                        <div class="card border-0 shadow-xs mb-3" style="border-radius: 12px;">
                            <div class="card-body p-3 small">
                                <h6 class="font-weight-bold mb-2 text-dark">
                                    <i class="fas fa-university text-primary mr-1"></i> Thông tin chuyển khoản thủ công:
                                </h6>
                                
                                <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                                    <span class="text-muted">Ngân hàng:</span>
                                    <strong class="text-dark">MB Bank (Ngân hàng Quân Đội)</strong>
                                </div>

                                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                                    <span class="text-muted">Chủ tài khoản:</span>
                                    <strong class="text-dark">THU VIEN CAN THO</strong>
                                </div>

                                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                                    <span class="text-muted">Số tài khoản:</span>
                                    <div class="d-flex align-items-center">
                                        <strong class="text-primary font-monospace mr-2" style="font-size: 1rem;">0901234567</strong>
                                        <button 
                                            class="btn btn-xs btn-outline-primary py-0 px-2"
                                            @click="copyToClipboard('0901234567', 'acc')"
                                        >
                                            <i class="fas" :class="copiedField === 'acc' ? 'fa-check text-success' : 'fa-copy'"></i>
                                            {{ copiedField === 'acc' ? 'Đã chép' : 'Sao chép' }}
                                        </button>
                                    </div>
                                </div>

                                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                                    <span class="text-muted">Số tiền:</span>
                                    <div class="d-flex align-items-center">
                                        <strong class="text-danger font-weight-bold mr-2">{{ formatVND(selectedPenaltyForQr.fineAmount) }}</strong>
                                        <button 
                                            class="btn btn-xs btn-outline-primary py-0 px-2"
                                            @click="copyToClipboard(Math.round(selectedPenaltyForQr.fineAmount * 25400).toString(), 'amount')"
                                        >
                                            <i class="fas" :class="copiedField === 'amount' ? 'fa-check text-success' : 'fa-copy'"></i>
                                            {{ copiedField === 'amount' ? 'Đã chép' : 'Sao chép' }}
                                        </button>
                                    </div>
                                </div>

                                <div class="d-flex justify-content-between align-items-center py-2">
                                    <span class="text-muted">Nội dung CK:</span>
                                    <div class="d-flex align-items-center">
                                        <strong class="text-dark font-monospace mr-2" style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
                                            NOPPHAT {{ selectedPenaltyForQr.penaltyId }}
                                        </strong>
                                        <button 
                                            class="btn btn-xs btn-outline-primary py-0 px-2"
                                            @click="copyToClipboard('NOPPHAT ' + selectedPenaltyForQr.penaltyId, 'content')"
                                        >
                                            <i class="fas" :class="copiedField === 'content' ? 'fa-check text-success' : 'fa-copy'"></i>
                                            {{ copiedField === 'content' ? 'Đã chép' : 'Sao chép' }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Ghi chú chuyển khoản / mã GD -->
                        <div class="form-group mb-0">
                            <label class="font-weight-semibold small mb-1 text-dark">
                                Ghi chú thêm / Mã giao dịch ngân hàng (Tùy chọn):
                            </label>
                            <input 
                                v-model="paymentProofNote"
                                type="text"
                                class="form-control form-control-sm"
                                placeholder="VD: Đã chuyển qua Vietcombank số đuôi 1234"
                            />
                            <small class="text-muted mt-1 d-block" style="font-size: 0.76rem;">
                                * Sau khi hoàn tất chuyển khoản trên ứng dụng ngân hàng, vui lòng bấm nút xác nhận dưới đây để thủ thư kiểm tra và duyệt biên bản.
                            </small>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="modal-footer bg-white border-top py-2 px-3 d-flex justify-content-between">
                        <button type="button" class="btn btn-outline-secondary btn-sm" @click="showQrModal = false">
                            Đóng lại
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-success btn-sm px-3 font-weight-bold shadow-sm"
                            :disabled="submittingQrConfirmation"
                            @click="handleConfirmQrPayment"
                        >
                            <span v-if="submittingQrConfirmation" class="spinner-border spinner-border-sm mr-1"></span>
                            <i v-else class="fas fa-check-circle mr-1"></i>
                            Xác nhận đã chuyển khoản
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.return-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.return-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08) !important;
}

.bg-danger-light {
    background-color: #fee2e2 !important;
}

.nav-pills .nav-link {
    border-radius: 8px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
}
</style>
