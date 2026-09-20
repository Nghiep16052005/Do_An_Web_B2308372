<script>
import AdminBorrowRecordService from "@/services/admin/borrowRecord.service";

export default {
    name: "AdminBorrowRecordList",

    data() {
        return {
            records: [],
            keyword: "",
            loading: false,
            errorMessage: ""
        };
    },

    computed: {
        filteredRecords() {
            if (!this.keyword.trim()) return this.records;
            const kw = this.keyword.toLowerCase().trim();
            return this.records.filter(r => 
                (r.readerId && r.readerId.toLowerCase().includes(kw)) ||
                (r.bookId && r.bookId.toLowerCase().includes(kw)) ||
                (r.status && r.status.toLowerCase().includes(kw))
            );
        }
    },

    mounted() {
        this.fetchRecords();
    },

    methods: {
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

        formatDate(dateStr) {
            if (!dateStr) return "-";
            return new Date(dateStr).toLocaleDateString("vi-VN");
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
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
            <div>
                <h3 class="font-weight-bold mb-1">Quản lý Mượn trả sách</h3>
                <p class="text-muted mb-0">Theo dõi thông tin và trạng thái các phiếu mượn sách trong thư viện</p>
            </div>
            <div class="mt-3 mt-md-0">
                <button class="btn btn-outline-primary btn-sm" @click="fetchRecords">
                    <i class="fas fa-sync-alt mr-1"></i> Làm mới
                </button>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-triangle mr-1"></i> {{ errorMessage }}
        </div>

        <!-- Filter -->
        <div class="card shadow-sm mb-4">
            <div class="card-body py-3">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
                            </div>
                            <input 
                                v-model="keyword" 
                                type="text" 
                                class="form-control" 
                                placeholder="Tìm kiếm theo mã độc giả, mã sách, trạng thái..." 
                            />
                            <div v-if="keyword" class="input-group-append">
                                <button class="btn btn-outline-secondary" @click="keyword = ''">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 text-md-right text-muted mt-2 mt-md-0 small">
                        Hiển thị <strong>{{ filteredRecords.length }}</strong> / {{ records.length }} phiếu mượn
                    </div>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="card shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Mã độc giả</th>
                            <th>Mã sách</th>
                            <th>Người xử lý</th>
                            <th>Ngày mượn</th>
                            <th>Hạn trả</th>
                            <th>Ngày trả</th>
                            <th>Trạng thái</th>
                            <th class="text-center">Thao tác</th>
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
                                <i class="fas fa-clipboard-check fa-2x mb-2 d-block text-muted"></i>
                                Hiện chưa có phiếu mượn nào được ghi nhận.
                            </td>
                        </tr>
                        <tr v-else v-for="r in filteredRecords" :key="r._id">
                            <td class="font-weight-bold text-primary">{{ r.readerId }}</td>
                            <td><span class="badge badge-light border">{{ r.bookId }}</span></td>
                            <td class="small text-muted">{{ r.employeeId || "SYSTEM" }}</td>
                            <td>{{ formatDate(r.borrowDate) }}</td>
                            <td class="font-weight-semibold text-danger">{{ formatDate(r.dueDate) }}</td>
                            <td>{{ formatDate(r.returnDate) }}</td>
                            <td>
                                <span :class="['badge', getStatusBadge(r.status)]">
                                    {{ translateStatus(r.status) }}
                                </span>
                            </td>
                            <td class="text-center text-nowrap">
                                <router-link 
                                    :to="{ name: 'admin-borrow-record-detail', params: { id: r._id } }" 
                                    class="btn btn-outline-info btn-sm"
                                    title="Xem chi tiết"
                                >
                                    <i class="fas fa-eye"></i>
                                </router-link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
