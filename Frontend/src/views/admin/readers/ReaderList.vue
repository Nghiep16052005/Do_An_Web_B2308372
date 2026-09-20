<script>
import AdminReaderService from "@/services/admin/reader.service";

export default {
    name: "AdminReaderList",

    data() {
        return {
            readers: [],
            keyword: "",
            loading: false,
            errorMessage: "",
            successMessage: ""
        };
    },

    computed: {
        filteredReaders() {
            if (!this.keyword.trim()) return this.readers;
            const kw = this.keyword.toLowerCase().trim();
            return this.readers.filter(r => 
                (r.readerId && r.readerId.toLowerCase().includes(kw)) ||
                (r.fullName && r.fullName.toLowerCase().includes(kw)) ||
                (r.phoneNumber && r.phoneNumber.includes(kw)) ||
                (r.email && r.email.toLowerCase().includes(kw))
            );
        }
    },

    mounted() {
        this.fetchReaders();
    },

    methods: {
        async fetchReaders() {
            this.loading = true;
            this.errorMessage = "";
            try {
                const response = await AdminReaderService.getAllReaders();
                if (response.success) {
                    this.readers = response.data || [];
                } else {
                    this.errorMessage = response.message || "Không thể tải danh sách độc giả.";
                }
            } catch (error) {
                console.error("Fetch readers error:", error);
                this.errorMessage = "Không thể kết nối đến máy chủ.";
            } finally {
                this.loading = false;
            }
        },

        async handleDelete(readerId) {
            if (!confirm(`Bạn có chắc chắn muốn xóa độc giả có mã "${readerId}" không?`)) {
                return;
            }

            try {
                const response = await AdminReaderService.deleteReader(readerId);
                if (response.success) {
                    this.successMessage = "Xóa độc giả thành công!";
                    await this.fetchReaders();
                    setTimeout(() => { this.successMessage = ""; }, 3000);
                } else {
                    this.errorMessage = response.message || "Xóa độc giả thất bại.";
                }
            } catch (error) {
                console.error("Delete reader error:", error);
                this.errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi xóa độc giả.";
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return "-";
            return new Date(dateStr).toLocaleDateString("vi-VN");
        },

        translateGender(g) {
            if (g === "Male") return "Nam";
            if (g === "Female") return "Nữ";
            return "Khác";
        }
    }
};
</script>

<template>
    <div>
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
            <div>
                <h3 class="font-weight-bold mb-1">Quản lý Độc giả</h3>
                <p class="text-muted mb-0">Quản lý thông tin bạn đọc và thẻ mượn sách thư viện</p>
            </div>
            <div class="mt-3 mt-md-0">
                <router-link :to="{ name: 'admin-reader-add' }" class="btn btn-success">
                    <i class="fas fa-user-plus mr-1"></i> Thêm độc giả mới
                </router-link>
            </div>
        </div>

        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
            <i class="fas fa-check-circle mr-1"></i> {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show">
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
                                placeholder="Tìm kiếm theo mã, họ tên, số điện thoại..." 
                            />
                            <div v-if="keyword" class="input-group-append">
                                <button class="btn btn-outline-secondary" @click="keyword = ''">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 text-md-right text-muted mt-2 mt-md-0 small">
                        Hiển thị <strong>{{ filteredReaders.length }}</strong> / {{ readers.length }} độc giả
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
                            <th>Họ và tên</th>
                            <th>Ngày sinh</th>
                            <th>Giới tính</th>
                            <th>Số điện thoại</th>
                            <th>Email</th>
                            <th>Trạng thái</th>
                            <th class="text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="8" class="text-center py-5">
                                <div class="spinner-border text-primary spinner-border-sm mr-2"></div>
                                Đang tải danh sách độc giả...
                            </td>
                        </tr>
                        <tr v-else-if="filteredReaders.length === 0">
                            <td colspan="8" class="text-center py-5 text-muted">
                                <i class="fas fa-users-slash fa-2x mb-2 d-block text-muted"></i>
                                Không tìm thấy độc giả nào phù hợp.
                            </td>
                        </tr>
                        <tr v-else v-for="r in filteredReaders" :key="r.readerId">
                            <td class="font-weight-bold text-primary">{{ r.readerId }}</td>
                            <td class="font-weight-semibold">{{ r.fullName }}</td>
                            <td>{{ formatDate(r.dateOfBirth) }}</td>
                            <td>{{ translateGender(r.gender) }}</td>
                            <td>{{ r.phoneNumber }}</td>
                            <td class="small">{{ r.email || "-" }}</td>
                            <td>
                                <span :class="['badge', r.status === 'Active' ? 'badge-success' : 'badge-secondary']">
                                    {{ r.status === 'Active' ? 'Hoạt động' : 'Tạm khóa' }}
                                </span>
                            </td>
                            <td class="text-center text-nowrap">
                                <router-link 
                                    :to="{ name: 'admin-reader-detail', params: { id: r.readerId } }" 
                                    class="btn btn-outline-info btn-sm mr-1"
                                    title="Xem chi tiết"
                                >
                                    <i class="fas fa-eye"></i>
                                </router-link>
                                <router-link 
                                    :to="{ name: 'admin-reader-edit', params: { id: r.readerId } }" 
                                    class="btn btn-outline-warning btn-sm mr-1"
                                    title="Chỉnh sửa"
                                >
                                    <i class="fas fa-edit"></i>
                                </router-link>
                                <button 
                                    class="btn btn-outline-danger btn-sm"
                                    title="Xóa độc giả"
                                    @click="handleDelete(r.readerId)"
                                >
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
