<script>
import AdminBorrowRecordService from "@/services/admin/borrowRecord.service";

export default {
    name: "AdminBorrowRecordDetail",

    data() {
        return {
            recordId: this.$route.params.id,
            record: null,
            loading: false,
            errorMessage: "",
            successMessage: "",
            submitting: false
        };
    },

    mounted() {
        this.fetchRecord();
    },

    methods: {
        async fetchRecord() {
            this.loading = true;
            try {
                const response = await AdminBorrowRecordService.getBorrowRecordById(this.recordId);
                if (response.success && response.data) {
                    this.record = response.data;
                } else {
                    this.errorMessage = response.message || "Không tìm thấy thông tin phiếu mượn.";
                }
            } catch (error) {
                console.error("Get record detail error:", error);
                this.errorMessage = "Không thể tải chi tiết phiếu mượn.";
            } finally {
                this.loading = false;
            }
        },

        async handleConfirmReturn() {
            if (!confirm("Bạn có chắc chắn muốn xác nhận đã trả sách cho phiếu mượn này?")) {
                return;
            }

            this.submitting = true;
            try {
                const response = await AdminBorrowRecordService.updateStatus(this.recordId, "Returned");
                if (response.success) {
                    this.successMessage = "Xác nhận trả sách thành công! Số lượng sách trong kho đã được cộng lại.";
                    await this.fetchRecord();
                } else {
                    alert(response.message || "Không thể cập nhật trạng thái phiếu mượn.");
                }
            } catch (error) {
                console.error("Confirm return error:", error);
                alert("Đã xảy ra lỗi khi xác nhận trả sách.");
            } finally {
                this.submitting = false;
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return "Chưa có";
            return new Date(dateStr).toLocaleString("vi-VN");
        },

        getStatusBadge(status) {
            switch (status) {
                case "ReturnPending":
                    return "badge-warning text-dark font-weight-bold";
                case "Borrowing":
                    return "badge-primary";
                case "Returned":
                    return "badge-success";
                case "Overdue":
                    return "badge-danger";
                default:
                    return "badge-secondary";
            }
        },

        translateStatus(status) {
            switch (status) {
                case "ReturnPending":
                    return "Chờ duyệt trả";
                case "Borrowing":
                    return "Đang mượn";
                case "Returned":
                    return "Đã trả";
                case "Overdue":
                    return "Quá hạn";
                default:
                    return status;
            }
        }
    }
};
</script>

<template>
    <div>
        <div class="d-flex align-items-center mb-4">
            <router-link :to="{ name: 'admin-borrow-records' }" class="btn btn-outline-secondary btn-sm mr-3">
                <i class="fas fa-arrow-left mr-1"></i> Quay lại
            </router-link>
            <div>
                <h3 class="font-weight-bold mb-0">Chi tiết Phiếu mượn sách</h3>
                <p class="text-muted small mb-0">Mã phiếu: {{ recordId }}</p>
            </div>
        </div>

        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
            <i class="fas fa-check-circle mr-1"></i> {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Đang tải thông tin phiếu mượn...</p>
        </div>

        <div v-else-if="record" class="card shadow-sm" style="max-width: 850px;">
            <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <h5 class="mb-0 font-weight-bold text-dark">
                    <i class="fas fa-file-invoice mr-2 text-primary"></i> Thông tin phiếu mượn
                </h5>
                <span :class="['badge px-3 py-2', getStatusBadge(record.status)]" style="font-size: 0.9rem;">
                    {{ translateStatus(record.status) }}
                </span>
            </div>
            <div class="card-body p-4">
                <div class="row">
                    <!-- Độc giả -->
                    <div class="col-md-6 mb-4">
                        <span class="text-muted d-block small mb-1">Thông tin Độc giả</span>
                        <div class="p-3 bg-light rounded">
                            <strong class="h6 text-primary d-block mb-1">{{ record.reader?.fullName || record.readerId }}</strong>
                            <div class="small text-muted">Mã ĐG: {{ record.readerId }}</div>
                            <div v-if="record.reader?.phoneNumber" class="small text-muted">SĐT: {{ record.reader.phoneNumber }}</div>
                        </div>
                    </div>

                    <!-- Sách -->
                    <div class="col-md-6 mb-4">
                        <span class="text-muted d-block small mb-1">Thông tin Tựa sách</span>
                        <div class="p-3 bg-light rounded">
                            <strong class="h6 text-dark d-block mb-1">{{ record.book?.title || record.bookId }}</strong>
                            <div class="small text-muted">Mã sách: {{ record.bookId }}</div>
                            <div v-if="record.book?.author" class="small text-muted">Tác giả: {{ record.book.author }}</div>
                        </div>
                    </div>

                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Người xác nhận / xử lý</span>
                        <span class="font-weight-semibold">{{ record.employeeId === 'SYSTEM' ? 'Hệ thống trực tuyến (Online)' : (record.employeeId || 'Chưa xác định') }}</span>
                    </div>

                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Ngày mượn</span>
                        <strong class="text-dark">{{ formatDate(record.borrowDate) }}</strong>
                    </div>

                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Hạn trả sách</span>
                        <strong class="text-danger font-weight-bold">{{ formatDate(record.dueDate) }}</strong>
                    </div>

                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Ngày trả thực tế</span>
                        <span :class="record.returnDate ? 'text-success font-weight-bold' : 'text-muted font-italic'">
                            {{ record.returnDate ? formatDate(record.returnDate) : 'Chưa hoàn trả' }}
                        </span>
                    </div>
                </div>

                <!-- Action Button if ReturnPending or Borrowing -->
                <div v-if="record.status === 'ReturnPending'" class="mt-4 pt-3 border-top d-flex justify-content-end">
                    <button 
                        class="btn btn-warning text-dark font-weight-bold px-4 shadow-sm" 
                        :disabled="submitting"
                        @click="handleConfirmReturn"
                    >
                        <span v-if="submitting" class="spinner-border spinner-border-sm mr-1"></span>
                        <i v-else class="fas fa-check-circle mr-1"></i> Duyệt yêu cầu trả sách
                    </button>
                </div>
                <div v-else-if="record.status === 'Borrowing'" class="mt-4 pt-3 border-top d-flex justify-content-end">
                    <button 
                        class="btn btn-success font-weight-bold px-4" 
                        :disabled="submitting"
                        @click="handleConfirmReturn"
                    >
                        <span v-if="submitting" class="spinner-border spinner-border-sm mr-1"></span>
                        <i v-else class="fas fa-undo-alt mr-1"></i> Xác nhận bạn đọc đã trả sách
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
