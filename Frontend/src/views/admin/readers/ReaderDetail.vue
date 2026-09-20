<script>
import AdminReaderService from "@/services/admin/reader.service";

export default {
    name: "AdminReaderDetail",

    data() {
        return {
            readerId: this.$route.params.id,
            reader: null,
            loading: false,
            errorMessage: ""
        };
    },

    mounted() {
        this.fetchReader();
    },

    methods: {
        async fetchReader() {
            this.loading = true;
            try {
                const response = await AdminReaderService.getReaderById(this.readerId);
                if (response.success && response.data) {
                    this.reader = response.data;
                } else {
                    this.errorMessage = response.message || "Không tìm thấy thông tin độc giả.";
                }
            } catch (error) {
                console.error("Get reader detail error:", error);
                this.errorMessage = "Không thể tải chi tiết độc giả.";
            } finally {
                this.loading = false;
            }
        },

        async handleDelete() {
            if (!confirm(`Bạn có chắc chắn muốn xóa độc giả "${this.reader.fullName}" không?`)) {
                return;
            }

            try {
                const response = await AdminReaderService.deleteReader(this.readerId);
                if (response.success) {
                    this.$router.push({ name: "admin-readers" });
                } else {
                    alert(response.message || "Xóa độc giả thất bại.");
                }
            } catch (error) {
                console.error("Delete reader error:", error);
                alert("Đã xảy ra lỗi khi xóa độc giả.");
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
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div class="d-flex align-items-center">
                <router-link :to="{ name: 'admin-readers' }" class="btn btn-outline-secondary btn-sm mr-3">
                    <i class="fas fa-arrow-left mr-1"></i> Quay lại
                </router-link>
                <div>
                    <h3 class="font-weight-bold mb-0">Hồ sơ độc giả</h3>
                    <p class="text-muted small mb-0">Mã độc giả: {{ readerId }}</p>
                </div>
            </div>

            <div v-if="reader" class="d-flex">
                <router-link 
                    :to="{ name: 'admin-reader-edit', params: { id: readerId } }" 
                    class="btn btn-warning btn-sm mr-2"
                >
                    <i class="fas fa-edit mr-1"></i> Chỉnh sửa
                </router-link>
                <button class="btn btn-danger btn-sm" @click="handleDelete">
                    <i class="fas fa-trash-alt mr-1"></i> Xóa
                </button>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Đang tải hồ sơ độc giả...</p>
        </div>

        <div v-else-if="reader" class="card shadow-sm" style="max-width: 850px;">
            <div class="card-header bg-white d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <div class="avatar-circle mr-3" style="width: 45px; height: 45px; font-size: 1.2rem;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <h5 class="mb-0 font-weight-bold text-dark">{{ reader.fullName }}</h5>
                        <span class="small text-muted">{{ reader.readerId }}</span>
                    </div>
                </div>
                <span :class="['badge', reader.status === 'Active' ? 'badge-success' : 'badge-secondary']">
                    {{ reader.status === 'Active' ? 'Hoạt động' : 'Tạm khóa' }}
                </span>
            </div>
            <div class="card-body p-4">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Ngày sinh</span>
                        <strong class="h6">{{ formatDate(reader.dateOfBirth) }}</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Giới tính</span>
                        <strong class="h6">{{ translateGender(reader.gender) }}</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Số điện thoại</span>
                        <strong class="h6 text-primary">{{ reader.phoneNumber }}</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Email</span>
                        <span>{{ reader.email || "-" }}</span>
                    </div>
                    <div class="col-12 mb-3">
                        <span class="text-muted d-block small">Địa chỉ thường trú</span>
                        <p class="mb-0">{{ reader.address }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
