<script>
import ClientBorrowRecordService from "@/services/client/borrowRecord.service";
import ClientAuthService from "@/services/client/auth.service";

export default {
    name: "ClientBorrowRecordList",

    data() {
        return {
            records: [],
            reader: null,
            loading: false,
            returningId: null,
            errorMessage: "",
            successMessage: ""
        };
    },

    mounted() {
        this.reader = ClientAuthService.getCurrentReader();
        this.fetchRecords();
    },

    methods: {
        async fetchRecords() {
            this.loading = true;
            this.errorMessage = "";
            try {
                const response = await ClientBorrowRecordService.getMyBorrowRecords();
                if (response.success) {
                    this.records = response.data || [];
                } else {
                    this.errorMessage = response.message || "Không thể tải danh sách phiếu mượn.";
                }
            } catch (error) {
                console.error("Fetch borrow records error:", error);
                this.errorMessage = error.response?.data?.message || "Không thể kết nối đến máy chủ thư viện.";
            } finally {
                this.loading = false;
            }
        },

        async handleReturnBook(record) {
            if (!confirm(`Bạn có chắc chắn muốn trả sách "${record.bookId}" không?`)) {
                return;
            }

            this.returningId = record._id;
            this.errorMessage = "";
            this.successMessage = "";

            try {
                const response = await ClientBorrowRecordService.returnBook(record._id);
                if (response.success) {
                    this.successMessage = `Đã trả sách mã ${record.bookId} thành công!`;
                    await this.fetchRecords();
                } else {
                    this.errorMessage = response.message || "Trả sách thất bại.";
                }
            } catch (error) {
                console.error("Return book error:", error);
                this.errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi thực hiện trả sách.";
            } finally {
                this.returningId = null;
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return "-";
            return new Date(dateStr).toLocaleDateString("vi-VN");
        },

        isOverdue(dueDateStr, status) {
            if (status === "Returned") return false;
            if (!dueDateStr) return false;
            return new Date(dueDateStr) < new Date();
        }
    }
};
</script>

<template>
    <div>
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
            <div>
                <h3 class="font-weight-bold mb-1">
                    <i class="fas fa-history text-primary mr-2"></i> Phiếu mượn sách của tôi
                </h3>
                <p class="text-muted mb-0">
                    Theo dõi tình trạng các cuốn sách bạn đang mượn và lịch sử trả sách
                </p>
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
        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show">
            <i class="fas fa-exclamation-triangle mr-1"></i> {{ errorMessage }}
        </div>

        <div class="card shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Mã sách</th>
                            <th>Ngày mượn</th>
                            <th>Hạn trả sách</th>
                            <th>Ngày trả</th>
                            <th>Tình trạng</th>
                            <th class="text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="6" class="text-center py-5">
                                <div class="spinner-border text-primary spinner-border-sm mr-2"></div>
                                Đang tải danh sách mượn sách...
                            </td>
                        </tr>
                        <tr v-else-if="records.length === 0">
                            <td colspan="6" class="text-center py-5 text-muted">
                                <i class="fas fa-book-open fa-2x mb-3 d-block text-muted"></i>
                                Bạn hiện chưa có phiếu mượn sách nào.
                                <div class="mt-2">
                                    <router-link :to="{ name: 'client-books' }" class="btn btn-primary btn-sm">
                                        Tìm sách để mượn ngay &rarr;
                                    </router-link>
                                </div>
                            </td>
                        </tr>
                        <tr v-else v-for="r in records" :key="r._id">
                            <td class="font-weight-bold text-primary">
                                <router-link :to="{ name: 'client-book-detail', params: { id: r.bookId } }">
                                    {{ r.bookId }}
                                </router-link>
                            </td>
                            <td>{{ formatDate(r.borrowDate) }}</td>
                            <td>
                                <span :class="{'text-danger font-weight-bold': isOverdue(r.dueDate, r.status)}">
                                    {{ formatDate(r.dueDate) }}
                                    <span v-if="isOverdue(r.dueDate, r.status)" class="badge badge-danger ml-1 small">
                                        Quá hạn
                                    </span>
                                </span>
                            </td>
                            <td>
                                <span v-if="r.returnDate" class="text-success font-weight-semibold">
                                    {{ formatDate(r.returnDate) }}
                                </span>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <span v-if="r.status === 'Borrowing'" class="badge badge-primary">
                                    Đang mượn
                                </span>
                                <span v-else-if="r.status === 'Returned'" class="badge badge-success">
                                    Đã trả
                                </span>
                                <span v-else class="badge badge-secondary">
                                    {{ r.status }}
                                </span>
                            </td>
                            <td class="text-center">
                                <button 
                                    v-if="r.status === 'Borrowing'" 
                                    class="btn btn-outline-success btn-sm font-weight-semibold" 
                                    :disabled="returningId === r._id"
                                    @click="handleReturnBook(r)"
                                >
                                    <span v-if="returningId === r._id" class="spinner-border spinner-border-sm mr-1"></span>
                                    <i v-else class="fas fa-undo mr-1"></i> Trả sách
                                </button>
                                <span v-else class="text-muted small">
                                    <i class="fas fa-check-double text-success"></i> Hoàn tất
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
