<script>
import AdminBorrowRecordService from "@/services/admin/borrowRecord.service";

export default {
    name: "AdminBorrowRecordList",

    data() {
        return {
            records: [],
            keyword: "",
            statusFilter: "ALL",
            loading: false,
            errorMessage: "",
            successMessage: ""
        };
    },

    computed: {
        pendingCount() {
            return this.records.filter(r => r.status === "ReturnPending").length;
        },
        borrowingCount() {
            return this.records.filter(r => r.status === "Borrowing").length;
        },
        returnedCount() {
            return this.records.filter(r => r.status === "Returned").length;
        },
        filteredRecords() {
            let result = this.records;
            if (this.statusFilter !== "ALL") {
                result = result.filter(r => r.status === this.statusFilter);
            }
            if (!this.keyword.trim()) return result;
            const kw = this.keyword.toLowerCase().trim();
            return result.filter(r => 
                (r.readerId && r.readerId.toLowerCase().includes(kw)) ||
                (r.readerName && r.readerName.toLowerCase().includes(kw)) ||
                (r.bookId && r.bookId.toLowerCase().includes(kw)) ||
                (r.bookTitle && r.bookTitle.toLowerCase().includes(kw)) ||
                (r.status && r.status.toLowerCase().includes(kw))
            );
        }
    },

    mounted() {
        this.fetchRecords();
        window.addEventListener("new-borrow-record", this.handleRealtimeUpdate);
        window.addEventListener("borrow-record-updated", this.handleRealtimeUpdate);
        window.addEventListener("return-request", this.handleRealtimeUpdate);
    },

    beforeUnmount() {
        window.removeEventListener("new-borrow-record", this.handleRealtimeUpdate);
        window.removeEventListener("borrow-record-updated", this.handleRealtimeUpdate);
        window.removeEventListener("return-request", this.handleRealtimeUpdate);
    },

    methods: {
        handleRealtimeUpdate() {
            this.fetchRecords();
        },

        async fetchRecords() {
            this.loading = true;
            this.errorMessage = "";
            try {
                const response = await AdminBorrowRecordService.getAllBorrowRecords();
                if (response.success) {
                    this.records = response.data || [];
                } else {
                    this.errorMessage = response.message || "Không thể tải danh sách phiếu mượn.";
                }
            } catch (error) {
                console.error("Fetch borrow records error:", error);
                this.errorMessage = "Không thể kết nối đến máy chủ.";
            } finally {
                this.loading = false;
            }
        },

        async handleApproveReturn(record) {
            const bookName = record.bookTitle || record.bookId;
            const reader = record.readerName || record.readerId;
            if (!confirm(`Xác nhận DUYỆT yêu cầu trả sách "${bookName}" của độc giả "${reader}"?`)) {
                return;
            }

            try {
                const response = await AdminBorrowRecordService.updateStatus(record._id, "Returned");
                if (response.success) {
                    this.successMessage = `Đã duyệt yêu cầu trả sách "${bookName}" thành công! Đã gửi thông báo thành công cho độc giả.`;
                    await this.fetchRecords();
                    window.dispatchEvent(new CustomEvent("borrow-record-updated"));
                    setTimeout(() => { this.successMessage = ""; }, 5000);
                } else {
                    alert(response.message || "Không thể duyệt yêu cầu trả sách.");
                }
            } catch (error) {
                console.error("Approve return error:", error);
                alert("Đã xảy ra lỗi khi duyệt trả sách.");
            }
        },

        async handleConfirmReturn(record) {
            if (!confirm(`Xác nhận độc giả đã trả sách "${record.bookTitle || record.bookId}"?`)) {
                return;
            }

            try {
                const response = await AdminBorrowRecordService.updateStatus(record._id, "Returned");
                if (response.success) {
                    this.successMessage = `Đã xác nhận trả sách mã ${record.bookId} thành công!`;
                    await this.fetchRecords();
                    setTimeout(() => { this.successMessage = ""; }, 4000);
                } else {
                    alert(response.message || "Không thể cập nhật trạng thái phiếu mượn.");
                }
            } catch (error) {
                console.error("Return error:", error);
                alert("Đã xảy ra lỗi khi xác nhận trả sách.");
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return "-";
            return new Date(dateStr).toLocaleDateString("vi-VN");
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
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
            <div>
                <h3 class="font-weight-bold mb-1">Quản lý Mượn trả sách</h3>
                <p class="text-muted mb-0">Theo dõi thông tin và trạng thái các phiếu mượn sách trong thư viện (cập nhật thời gian thực)</p>
            </div>
            <div class="mt-3 mt-md-0">
                <button class="btn btn-outline-primary btn-sm" @click="fetchRecords">
                    <i class="fas fa-sync-alt mr-1"></i> Làm mới
                </button>
            </div>
        </div>

        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
            <i class="fas fa-check-circle mr-1"></i> {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-triangle mr-1"></i> {{ errorMessage }}
        </div>

        <!-- Filter Tabs & Search -->
        <div class="card shadow-sm mb-4">
            <div class="card-body py-3">
                <div class="row align-items-center">
                    <div class="col-lg-7 mb-3 mb-lg-0">
                        <div class="btn-group btn-group-sm flex-wrap shadow-sm">
                            <button 
                                type="button" 
                                class="btn font-weight-semibold px-3"
                                :class="statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline-primary'"
                                @click="statusFilter = 'ALL'"
                            >
                                Tất cả ({{ records.length }})
                            </button>
                            <button 
                                type="button" 
                                class="btn font-weight-bold px-3"
                                :class="statusFilter === 'ReturnPending' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'"
                                @click="statusFilter = 'ReturnPending'"
                            >
                                <i class="fas fa-bell mr-1 text-danger" v-if="pendingCount > 0"></i>
                                Chờ duyệt trả ({{ pendingCount }})
                            </button>
                            <button 
                                type="button" 
                                class="btn font-weight-semibold px-3"
                                :class="statusFilter === 'Borrowing' ? 'btn-info' : 'btn-outline-info'"
                                @click="statusFilter = 'Borrowing'"
                            >
                                Đang mượn ({{ borrowingCount }})
                            </button>
                            <button 
                                type="button" 
                                class="btn font-weight-semibold px-3"
                                :class="statusFilter === 'Returned' ? 'btn-success' : 'btn-outline-success'"
                                @click="statusFilter = 'Returned'"
                            >
                                Đã trả ({{ returnedCount }})
                            </button>
                        </div>
                    </div>
                    <div class="col-lg-5">
                        <div class="input-group input-group-sm">
                            <div class="input-group-prepend">
                                <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
                            </div>
                            <input 
                                v-model="keyword" 
                                type="text" 
                                class="form-control" 
                                placeholder="Tìm kiếm mã/tên độc giả, sách..." 
                            />
                            <div v-if="keyword" class="input-group-append">
                                <button class="btn btn-outline-secondary" @click="keyword = ''">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="card shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover mb-0 align-middle">
                    <thead class="bg-light">
                        <tr>
                            <th style="min-width: 130px;">Mã độc giả</th>
                            <th style="min-width: 170px;">Mã sách</th>
                            <th style="min-width: 130px;">Người xử lý</th>
                            <th style="min-width: 110px;">Ngày mượn</th>
                            <th style="min-width: 110px;">Hạn trả</th>
                            <th style="min-width: 110px;">Ngày trả</th>
                            <th style="min-width: 110px;">Trạng thái</th>
                            <th class="text-center" style="min-width: 140px;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="8" class="text-center py-5">
                                <div class="spinner-border text-primary spinner-border-sm mr-2"></div>
                                Đang tải danh sách mượn trả...
                            </td>
                        </tr>
                        <tr v-else-if="filteredRecords.length === 0">
                            <td colspan="8" class="text-center py-5 text-muted">
                                <i class="fas fa-clipboard-check fa-2x mb-2 d-block text-muted" style="opacity: 0.5;"></i>
                                Hiện chưa có phiếu mượn nào được ghi nhận.
                            </td>
                        </tr>
                        <tr v-else v-for="r in filteredRecords" :key="r._id">
                            <!-- Mã độc giả -->
                            <td>
                                <strong class="text-primary font-weight-bold">{{ r.readerId }}</strong>
                                <div v-if="r.readerName" class="small text-dark mt-0">
                                    {{ r.readerName }}
                                </div>
                            </td>

                            <!-- Mã sách -->
                            <td>
                                <span class="badge badge-light border font-weight-bold">{{ r.bookId }}</span>
                                <div v-if="r.bookTitle" class="small font-weight-semibold text-secondary mt-1 text-truncate" style="max-width: 220px;" :title="r.bookTitle">
                                    {{ r.bookTitle }}
                                </div>
                            </td>

                            <!-- Người xử lý -->
                            <td>
                                <span v-if="r.employeeId === 'SYSTEM'" class="badge badge-secondary py-1 px-2">
                                    <i class="fas fa-globe mr-1"></i> Online
                                </span>
                                <span v-else class="small text-muted font-weight-semibold">
                                    {{ r.employeeId || "Chưa xác định" }}
                                </span>
                            </td>

                            <!-- Ngày mượn -->
                            <td class="text-nowrap">{{ formatDate(r.borrowDate) }}</td>

                            <!-- Hạn trả -->
                            <td class="font-weight-semibold text-danger text-nowrap">{{ formatDate(r.dueDate) }}</td>

                            <!-- Ngày trả -->
                            <td class="text-nowrap">
                                <span v-if="r.returnDate" class="text-success font-weight-semibold">
                                    {{ formatDate(r.returnDate) }}
                                </span>
                                <span v-else class="text-muted font-italic small">
                                    Chưa trả
                                </span>
                            </td>

                            <!-- Trạng thái -->
                            <td>
                                <span :class="['badge py-1 px-2', getStatusBadge(r.status)]">
                                    {{ translateStatus(r.status) }}
                                </span>
                            </td>

                            <!-- Thao tác -->
                            <td class="text-center text-nowrap">
                                <router-link 
                                    :to="{ name: 'admin-borrow-record-detail', params: { id: r._id } }" 
                                    class="btn btn-outline-info btn-sm mr-1"
                                    title="Xem chi tiết phiếu mượn"
                                >
                                    <i class="fas fa-eye"></i>
                                </router-link>

                                <button 
                                    v-if="r.status === 'ReturnPending'"
                                    class="btn btn-warning btn-sm text-dark font-weight-bold shadow-sm mr-1"
                                    title="Duyệt yêu cầu trả sách của độc giả"
                                    @click="handleApproveReturn(r)"
                                >
                                    <i class="fas fa-check-circle mr-1"></i> Duyệt
                                </button>

                                <button 
                                    v-else-if="r.status === 'Borrowing'"
                                    class="btn btn-outline-success btn-sm mr-1"
                                    title="Xác nhận trả sách trực tiếp tại quầy"
                                    @click="handleConfirmReturn(r)"
                                >
                                    <i class="fas fa-undo-alt mr-1"></i> Trả sách
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
