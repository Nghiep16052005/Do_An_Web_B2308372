<script>
import AdminPenaltyService from "@/services/admin/penalty.service";

export default {
    name: "AdminPenaltyList",

    data() {
        return {
            penalties: [],
            loading: false,
            keyword: "",
            filterType: "",
            filterStatus: "",
            updatingId: null,
            successMessage: "",
            errorMessage: ""
        };
    },

    computed: {
        filteredPenalties() {
            let list = this.penalties;

            if (this.filterType) {
                list = list.filter(p => p.type === this.filterType);
            }

            if (this.filterStatus) {
                list = list.filter(p => p.status === this.filterStatus);
            }

            if (this.keyword.trim()) {
                const q = this.keyword.toLowerCase().trim();
                list = list.filter(p => 
                    p.penaltyId.toLowerCase().includes(q) ||
                    p.readerId.toLowerCase().includes(q) ||
                    (p.readerName && p.readerName.toLowerCase().includes(q)) ||
                    p.bookId.toLowerCase().includes(q) ||
                    (p.bookTitle && p.bookTitle.toLowerCase().includes(q))
                );
            }

            return list;
        },

        totalUnpaidAmount() {
            return this.penalties
                .filter(p => p.status === "Pending")
                .reduce((sum, p) => sum + (p.fineAmount || 0), 0);
        },

        lostCount() {
            return this.penalties.filter(p => p.type === "LOST").length;
        },

        damagedCount() {
            return this.penalties.filter(p => p.type === "DAMAGED").length;
        },

        overdueCount() {
            return this.penalties.filter(p => p.type === "OVERDUE").length;
        },

        pendingApprovalCount() {
            return this.penalties.filter(p => p.status === "PaymentPending").length;
        }
    },

    mounted() {
        this.fetchPenalties();
        window.addEventListener("notification-updated", this.fetchPenalties);
        window.addEventListener("penalty-payment-pending", this.fetchPenalties);
        window.addEventListener("penalty-updated", this.fetchPenalties);
    },

    beforeUnmount() {
        window.removeEventListener("notification-updated", this.fetchPenalties);
        window.removeEventListener("penalty-payment-pending", this.fetchPenalties);
        window.removeEventListener("penalty-updated", this.fetchPenalties);
    },

    methods: {
        async fetchPenalties() {
            this.loading = true;
            this.errorMessage = "";
            try {
                const response = await AdminPenaltyService.getAllPenalties();
                if (response.success) {
                    this.penalties = response.data || [];
                } else {
                    this.errorMessage = response.message || "Không thể tải danh sách tiền phạt.";
                }
            } catch (error) {
                console.error("Admin fetch penalties error:", error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    this.errorMessage = "Phiên đăng nhập quản trị đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.";
                } else {
                    this.errorMessage = error.response?.data?.message || "Không thể kết nối đến máy chủ thư viện.";
                }
            } finally {
                this.loading = false;
            }
        },

        async handleApprovePayment(penalty) {
            if (!confirm(`Xác nhận bạn ĐÃ NHẬN ĐƯỢC tiền chuyển khoản ${this.formatCurrency(penalty.fineAmount)} cho mã phạt "${penalty.penaltyId}" từ độc giả ${penalty.readerName}?\n\nHệ thống sẽ duyệt hoàn tất nộp phạt và tự động mở khóa tài khoản cho độc giả.`)) {
                return;
            }

            this.updatingId = penalty._id;
            try {
                const response = await AdminPenaltyService.approvePayment(penalty._id);
                if (response.success) {
                    this.successMessage = `Đã duyệt thanh toán thành công cho mã phạt ${penalty.penaltyId}!`;
                    await this.fetchPenalties();
                    setTimeout(() => { this.successMessage = ""; }, 4000);
                } else {
                    alert(response.message || "Duyệt thanh toán thất bại.");
                }
            } catch (error) {
                console.error("Approve payment error:", error);
                alert(error.response?.data?.message || "Lỗi khi duyệt thanh toán.");
            } finally {
                this.updatingId = null;
            }
        },

        async handleRejectPayment(penalty) {
            const reason = prompt("Nhập lý do chưa nhận được thanh toán (để gửi thông báo cho độc giả kiểm tra lại):", "Chưa nhận được giao dịch chuyển khoản trong tài khoản ngân hàng");
            if (reason === null) return;

            this.updatingId = penalty._id;
            try {
                const response = await AdminPenaltyService.rejectPayment(penalty._id, reason);
                if (response.success) {
                    this.successMessage = `Đã gửi thông báo từ chối xác nhận cho độc giả ${penalty.readerName}!`;
                    await this.fetchPenalties();
                    setTimeout(() => { this.successMessage = ""; }, 4000);
                } else {
                    alert(response.message || "Thao tác thất bại.");
                }
            } catch (error) {
                console.error("Reject payment error:", error);
                alert(error.response?.data?.message || "Lỗi khi từ chối thanh toán.");
            } finally {
                this.updatingId = null;
            }
        },

        async handleUpdateStatus(penalty, newStatus) {
            const statusLabel = newStatus === "Paid" ? "Đã thu tiền" : "Miễn phạt";
            if (!confirm(`Bạn có chắc chắn muốn chuyển trạng thái phiếu phạt ${penalty.penaltyId} sang "${statusLabel}" không?`)) {
                return;
            }

            this.updatingId = penalty._id;
            try {
                const response = await AdminPenaltyService.updateStatus(penalty._id, newStatus);
                if (response.success) {
                    this.successMessage = `Cập nhật thành công phiếu phạt ${penalty.penaltyId}!`;
                    await this.fetchPenalties();
                    setTimeout(() => { this.successMessage = ""; }, 4000);
                } else {
                    alert(response.message || "Cập nhật thất bại.");
                }
            } catch (error) {
                console.error("Update penalty status error:", error);
                alert(error.response?.data?.message || "Lỗi khi cập nhật.");
            } finally {
                this.updatingId = null;
            }
        },

        formatCurrency(amount) {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2
            }).format(amount || 0);
        },

        formatDate(dateStr) {
            if (!dateStr) return "-";
            return new Date(dateStr).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            });
        }
    }
};
</script>

<template>
    <div>
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
            <div>
                <h3 class="font-weight-bold mb-1">
                    <i class="fas fa-file-invoice-dollar text-danger mr-2"></i> Quản Lý Vi Phạm & Tiền Phạt
                </h3>
                <p class="text-muted mb-0">Theo dõi, kiểm duyệt và quản lý các khoản phạt trễ hạn, sách hư hỏng và bồi thường mất sách</p>
            </div>
            <div class="mt-3 mt-md-0">
                <button class="btn btn-outline-primary btn-sm" @click="fetchPenalties" :disabled="loading">
                    <i class="fas fa-sync-alt mr-1" :class="{ 'fa-spin': loading }"></i> Làm mới
                </button>
            </div>
        </div>

        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
            <i class="fas fa-check-circle mr-1"></i> {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show">
            <i class="fas fa-exclamation-triangle mr-1"></i> {{ errorMessage }}
        </div>

        <!-- Cảnh báo có yêu cầu nộp phạt QR chờ duyệt -->
        <div v-if="pendingApprovalCount > 0" class="alert alert-warning border-warning shadow-sm d-flex flex-column flex-md-row align-items-md-center justify-content-between py-2 px-3 mb-4" style="border-radius: 10px; background-color: #fffbeb;">
            <div class="d-flex align-items-center mb-2 mb-md-0">
                <i class="fas fa-bell text-warning fa-2x mr-3"></i>
                <div>
                    <h6 class="font-weight-bold mb-0 text-dark">Có {{ pendingApprovalCount }} yêu cầu nộp phạt qua mã QR đang chờ bạn duyệt!</h6>
                    <small class="text-muted">Độc giả đã chuyển khoản và gửi xác nhận. Vui lòng kiểm tra tài khoản ngân hàng và bấm "Duyệt thanh toán".</small>
                </div>
            </div>
            <button class="btn btn-warning btn-sm font-weight-bold shadow-xs text-nowrap" @click="filterStatus = 'PaymentPending'">
                <i class="fas fa-filter mr-1"></i> Xem danh sách chờ duyệt &rarr;
            </button>
        </div>

        <!-- Thống kê tổng quan -->
        <div class="row mb-4">
            <div class="col-sm-6 col-lg-3 mb-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body d-flex align-items-center">
                        <div class="avatar-circle mr-3" style="width: 48px; height: 48px; background: #fee2e2; color: #ef4444; font-size: 1.25rem;">
                            <i class="fas fa-hand-holding-usd"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Tiền phạt chưa thu</div>
                            <div class="h4 font-weight-bold mb-0 text-danger">{{ formatCurrency(totalUnpaidAmount) }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-sm-6 col-lg-3 mb-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body d-flex align-items-center">
                        <div class="avatar-circle mr-3" style="width: 48px; height: 48px; background: #fef3c7; color: #d97706; font-size: 1.25rem;">
                            <i class="fas fa-tools"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Làm hư/trầy sách</div>
                            <div class="h4 font-weight-bold mb-0 text-dark">{{ damagedCount }} vụ</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-sm-6 col-lg-3 mb-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body d-flex align-items-center">
                        <div class="avatar-circle mr-3" style="width: 48px; height: 48px; background: #f1f5f9; color: #475569; font-size: 1.25rem;">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Báo mất sách (Giá bìa)</div>
                            <div class="h4 font-weight-bold mb-0 text-dark">{{ lostCount }} vụ</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-sm-6 col-lg-3 mb-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body d-flex align-items-center">
                        <div class="avatar-circle mr-3" style="width: 48px; height: 48px; background: #fee2e2; color: #dc2626; font-size: 1.25rem;">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Phạt trễ hạn lần 3 (1$)</div>
                            <div class="h4 font-weight-bold mb-0 text-dark">{{ overdueCount }} vụ</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bộ lọc & Tìm kiếm -->
        <div class="card shadow-sm mb-4">
            <div class="card-body py-3">
                <div class="row align-items-center">
                    <div class="col-md-5 mb-2 mb-md-0">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
                            </div>
                            <input 
                                v-model="keyword" 
                                type="text" 
                                class="form-control" 
                                placeholder="Tìm theo mã phạt, mã độc giả, tên sách..." 
                            />
                        </div>
                    </div>

                    <div class="col-md-3 mb-2 mb-md-0">
                        <select v-model="filterType" class="form-control">
                            <option value="">-- Tất cả loại vi phạm --</option>
                            <option value="OVERDUE">Trễ hạn (Lần 3 - 1$)</option>
                            <option value="DAMAGED">Hư / Trầy sách (Lũy tiến)</option>
                            <option value="LOST">Mất sách (Đền giá bìa)</option>
                        </select>
                    </div>

                    <div class="col-md-2 mb-2 mb-md-0">
                        <select v-model="filterStatus" class="form-control">
                            <option value="">-- Trạng thái --</option>
                            <option value="PaymentPending">⚡ Chờ duyệt QR ({{ pendingApprovalCount }})</option>
                            <option value="Pending">Chưa thu tiền</option>
                            <option value="Paid">Đã thu tiền</option>
                            <option value="Waived">Miễn phạt</option>
                        </select>
                    </div>

                    <div class="col-md-2 text-md-right text-muted small">
                        Hiển thị <strong>{{ filteredPenalties.length }}</strong> / {{ penalties.length }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Bảng danh sách phiếu phạt -->
        <div class="card shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Mã phạt</th>
                            <th>Độc giả</th>
                            <th>Cuốn sách</th>
                            <th>Loại vi phạm</th>
                            <th>Lý do vi phạm</th>
                            <th>Số tiền</th>
                            <th>Trạng thái</th>
                            <th>Thời gian</th>
                            <th class="text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="9" class="text-center py-5">
                                <div class="spinner-border text-primary spinner-border-sm mr-2"></div>
                                Đang tải danh sách biên bản phạt...
                            </td>
                        </tr>
                        <tr v-else-if="filteredPenalties.length === 0">
                            <td colspan="9" class="text-center py-5 text-muted">
                                <i class="fas fa-folder-open fa-2x mb-2 d-block text-muted"></i>
                                Không có biên bản vi phạm nào phù hợp.
                            </td>
                        </tr>
                        <tr v-else v-for="p in filteredPenalties" :key="p._id" :class="{ 'table-warning': p.status === 'PaymentPending' }">
                            <td class="font-weight-bold text-monospace">{{ p.penaltyId }}</td>
                            <td>
                                <div class="font-weight-bold text-dark">{{ p.readerName }}</div>
                                <small class="text-muted">Mã: {{ p.readerId }}</small>
                                <div v-if="p.status === 'Pending' && p.paymentDeadline && new Date(p.paymentDeadline) < new Date()" class="mt-1">
                                    <span class="badge badge-danger" style="font-size: 0.7rem;" title="Tài khoản độc giả đã bị khóa tạm thời do quá 3 ngày chưa nộp phạt">
                                        <i class="fas fa-lock mr-1"></i>Đã khóa tài khoản
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div class="font-weight-bold text-dark text-truncate" style="max-width: 220px;" :title="p.bookTitle">
                                    {{ p.bookTitle || p.bookId }}
                                </div>
                                <small class="text-muted">Mã sách: {{ p.bookId }}</small>
                            </td>
                            <td>
                                <span v-if="p.type === 'OVERDUE'" class="badge badge-danger">
                                    <i class="fas fa-clock mr-1"></i> Trễ hạn (Lần {{ p.occurrence }})
                                </span>
                                <span v-else-if="p.type === 'DAMAGED' && (p.severity === 'UNRECOVERABLE' || p.severity === 'HEAVY')" class="badge badge-danger">
                                    <i class="fas fa-times-circle mr-1"></i> Hư nặng (100% bìa)
                                </span>
                                <span v-else-if="p.type === 'DAMAGED'" class="badge badge-warning text-dark">
                                    <i class="fas fa-tools mr-1"></i> Hư/Trầy (Lần {{ p.occurrence }})
                                </span>
                                <span v-else-if="p.type === 'LOST'" class="badge badge-dark">
                                    <i class="fas fa-times-circle mr-1"></i> Mất sách
                                </span>
                            </td>
                            <td>
                                <div class="small" style="max-width: 260px;">{{ p.reason }}</div>
                            </td>
                            <td>
                                <span class="font-weight-bold text-danger" style="font-size: 1.05rem;">
                                    {{ formatCurrency(p.fineAmount) }}
                                </span>
                            </td>
                            <td>
                                <span v-if="p.status === 'Paid'" class="badge badge-success px-2 py-1">
                                    <i class="fas fa-check-circle mr-1"></i> Đã thu tiền
                                </span>
                                <span v-else-if="p.status === 'PaymentPending'" class="badge badge-warning text-dark px-2 py-1 font-weight-bold" style="background-color: #fef08a; border: 1px solid #eab308;">
                                    <i class="fas fa-hourglass-half mr-1 text-warning"></i> Chờ duyệt QR
                                </span>
                                <span v-else-if="p.status === 'Pending'" class="badge badge-danger px-2 py-1">
                                    <i class="fas fa-clock mr-1"></i> Chưa thu
                                </span>
                                <span v-else-if="p.status === 'Cancelled'" class="badge badge-secondary px-2 py-1" :title="p.cancellationReason">
                                    <i class="fas fa-undo mr-1"></i> Đã hủy
                                </span>
                                <span v-else class="badge badge-secondary px-2 py-1">
                                    {{ p.status }}
                                </span>
                                <div v-if="p.paymentMethod === 'QR_BANK'" class="small text-primary font-weight-semibold mt-1">
                                    <i class="fas fa-qrcode mr-1"></i>Chuyển khoản QR
                                </div>
                                <div v-if="p.paymentNote" class="small text-muted font-italic mt-1" style="max-width: 170px;">
                                    "{{ p.paymentNote }}"
                                </div>
                                <div v-else-if="p.cancellationReason" class="small text-muted font-italic mt-1" style="max-width: 170px;">
                                    {{ p.cancellationReason }}
                                </div>
                            </td>
                            <td class="small text-muted">
                                <div>{{ formatDate(p.createdAt) }}</div>
                                <div v-if="p.status === 'Pending' && p.paymentDeadline" class="mt-1">
                                    <span v-if="new Date(p.paymentDeadline) < new Date()" class="badge badge-danger font-weight-bold" style="font-size: 0.72rem;">
                                        <i class="fas fa-exclamation-circle mr-1"></i> Quá hạn 3 ngày
                                    </span>
                                    <span v-else class="text-muted" style="font-size: 0.75rem;">
                                        <i class="far fa-calendar-alt mr-1 text-primary"></i> Hạn: {{ formatDate(p.paymentDeadline) }}
                                    </span>
                                </div>
                            </td>
                            <td class="text-center text-nowrap">
                                <div v-if="p.status === 'PaymentPending'" class="btn-group btn-group-sm">
                                    <button 
                                        class="btn btn-success btn-sm font-weight-bold shadow-sm" 
                                        :disabled="updatingId === p._id"
                                        title="Xác nhận tài khoản đã nhận tiền và duyệt hoàn tất"
                                        @click="handleApprovePayment(p)"
                                    >
                                        <i class="fas fa-check-double mr-1"></i> Duyệt thanh toán
                                    </button>
                                    <button 
                                        class="btn btn-outline-danger btn-sm" 
                                        :disabled="updatingId === p._id"
                                        title="Từ chối nếu chưa nhận được tiền trong tài khoản"
                                        @click="handleRejectPayment(p)"
                                    >
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div v-else-if="p.status === 'Pending'" class="btn-group btn-group-sm">
                                    <button 
                                        class="btn btn-success btn-sm font-weight-bold" 
                                        :disabled="updatingId === p._id"
                                        title="Xác nhận độc giả đã nộp tiền phạt tại quầy"
                                        @click="handleUpdateStatus(p, 'Paid')"
                                    >
                                        <i class="fas fa-check mr-1"></i> Đã thu
                                    </button>
                                    <button 
                                        class="btn btn-outline-secondary btn-sm" 
                                        :disabled="updatingId === p._id"
                                        title="Miễn trừ khoản phạt"
                                        @click="handleUpdateStatus(p, 'Waived')"
                                    >
                                        Miễn
                                    </button>
                                </div>
                                <span v-else class="text-success small font-weight-bold">
                                    <i class="fas fa-check-circle mr-1"></i> Hoàn tất
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
