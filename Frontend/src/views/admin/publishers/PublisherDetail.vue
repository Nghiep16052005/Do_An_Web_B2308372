<script>
import AdminPublisherService from "@/services/admin/publisher.service";

export default {
    name: "AdminPublisherDetail",

    data() {
        return {
            publisherId: this.$route.params.id,
            publisher: null,
            loading: false,
            errorMessage: ""
        };
    },

    mounted() {
        this.fetchPublisher();
    },

    methods: {
        async fetchPublisher() {
            this.loading = true;
            try {
                const response = await AdminPublisherService.getPublisherById(this.publisherId);
                if (response.success && response.data) {
                    this.publisher = response.data;
                } else {
                    this.errorMessage = response.message || "Không tìm thấy thông tin nhà xuất bản.";
                }
            } catch (error) {
                console.error("Get publisher detail error:", error);
                this.errorMessage = "Không thể tải chi tiết nhà xuất bản.";
            } finally {
                this.loading = false;
            }
        },

        async handleDelete() {
            if (!confirm(`Bạn có chắc chắn muốn xóa nhà xuất bản "${this.publisher.name}" không?`)) {
                return;
            }

            try {
                const response = await AdminPublisherService.deletePublisher(this.publisherId);
                if (response.success) {
                    this.$router.push({ name: "admin-publishers" });
                } else {
                    alert(response.message || "Xóa nhà xuất bản thất bại.");
                }
            } catch (error) {
                console.error("Delete publisher error:", error);
                alert("Đã xảy ra lỗi khi xóa nhà xuất bản.");
            }
        }
    }
};
</script>

<template>
    <div>
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div class="d-flex align-items-center">
                <router-link :to="{ name: 'admin-publishers' }" class="btn btn-outline-secondary btn-sm mr-3">
                    <i class="fas fa-arrow-left mr-1"></i> Quay lại
                </router-link>
                <div>
                    <h3 class="font-weight-bold mb-0">Chi tiết Nhà xuất bản</h3>
                    <p class="text-muted small mb-0">Mã NXB: {{ publisherId }}</p>
                </div>
            </div>

            <div v-if="publisher" class="d-flex">
                <router-link 
                    :to="{ name: 'admin-publisher-edit', params: { id: publisherId } }" 
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
            <p class="mt-2 text-muted">Đang tải thông tin NXB...</p>
        </div>

        <div v-else-if="publisher" class="card shadow-sm" style="max-width: 800px;">
            <div class="card-header bg-white d-flex align-items-center">
                <div class="avatar-circle mr-3" style="width: 45px; height: 45px; background: #fef3c7; color: #d97706; font-size: 1.25rem;">
                    <i class="fas fa-building"></i>
                </div>
                <div>
                    <h5 class="mb-0 font-weight-bold text-dark">{{ publisher.name }}</h5>
                    <span class="small text-muted">{{ publisher.publisherId }}</span>
                </div>
            </div>
            <div class="card-body p-4">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Mã Nhà xuất bản</span>
                        <strong class="h6">{{ publisher.publisherId }}</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Số điện thoại</span>
                        <strong class="h6 text-primary">{{ publisher.phoneNumber }}</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Email liên hệ</span>
                        <span>{{ publisher.email || "-" }}</span>
                    </div>
                    <div class="col-12 mb-3">
                        <span class="text-muted d-block small">Địa chỉ trụ sở</span>
                        <p class="mb-0">{{ publisher.address }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
