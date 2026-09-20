<script>
import AdminBorrowRecordService from "@/services/admin/borrowRecord.service";

export default {
    name: "AdminBorrowRecordDetail",

    data() {
        return {
            recordId: this.$route.params.id,
            record: null,
            loading: false,
            errorMessage: ""
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

        formatDate(dateStr) {
            if (!dateStr) return "Chưa có";
            return new Date(dateStr).toLocaleString("vi-VN");
        },

        getStatusBadge(status) {
            switch (status) {
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

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Đang tải thông tin phiếu mượn...</p>
        </div>

        <div v-else-if="record" class="card shadow-sm" style="max-width: 800px;">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0 font-weight-bold text-dark">
                    <i class="fas fa-file-invoice mr-2 text-primary"></i> Thông tin phiếu mượn
                </h5>
                <span :class="['badge', getStatusBadge(record.status)]">
                    {{ translateStatus(record.status) }}
                </span>
            </div>
            <div class="card-body p-4">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Mã độc giả</span>
                        <strong class="h6 text-primary">{{ record.readerId }}</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Mã sách mượn</span>
                        <strong class="h6">{{ record.bookId }}</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Người xác nhận / xử lý</span>
                        <span>{{ record.employeeId || "Hệ thống tự động" }}</span>
                    </div>
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Ngày mượn</span>
                        <strong class="text-dark">{{ formatDate(record.borrowDate) }}</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Hạn trả sách</span>
                        <strong class="text-danger">{{ formatDate(record.dueDate) }}</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Ngày trả thực tế</span>
                        <span :class="record.returnDate ? 'text-success font-weight-bold' : 'text-muted'">
                            {{ formatDate(record.returnDate) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
