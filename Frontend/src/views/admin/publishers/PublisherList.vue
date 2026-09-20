<script>
import AdminPublisherService from "@/services/admin/publisher.service";

export default {
    name: "AdminPublisherList",

    data() {
        return {
            publishers: [],
            keyword: "",
            loading: false,
            errorMessage: "",
            successMessage: ""
        };
    },

    computed: {
        filteredPublishers() {
            if (!this.keyword.trim()) return this.publishers;
            const kw = this.keyword.toLowerCase().trim();
            return this.publishers.filter(p => 
                (p.publisherId && p.publisherId.toLowerCase().includes(kw)) ||
                (p.name && p.name.toLowerCase().includes(kw)) ||
                (p.phoneNumber && p.phoneNumber.includes(kw)) ||
                (p.email && p.email.toLowerCase().includes(kw))
            );
        }
    },

    mounted() {
        this.fetchPublishers();
    },

    methods: {
        async fetchPublishers() {
            this.loading = true;
            this.errorMessage = "";
            try {
                const response = await AdminPublisherService.getAllPublishers();
                if (response.success) {
                    this.publishers = response.data || [];
                } else {
                    this.errorMessage = response.message || "Không thể tải danh sách nhà xuất bản.";
                }
            } catch (error) {
                console.error("Fetch publishers error:", error);
                this.errorMessage = "Không thể kết nối đến máy chủ.";
            } finally {
                this.loading = false;
            }
        },

        async handleDelete(publisherId) {
            if (!confirm(`Bạn có chắc chắn muốn xóa nhà xuất bản "${publisherId}" không?`)) {
                return;
            }

            try {
                const response = await AdminPublisherService.deletePublisher(publisherId);
                if (response.success) {
                    this.successMessage = "Xóa nhà xuất bản thành công!";
                    await this.fetchPublishers();
                    setTimeout(() => { this.successMessage = ""; }, 3000);
                } else {
                    this.errorMessage = response.message || "Xóa nhà xuất bản thất bại.";
                }
            } catch (error) {
                console.error("Delete publisher error:", error);
                this.errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi xóa nhà xuất bản.";
            }
        }
    }
};
</script>

<template>
    <div>
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
            <div>
                <h3 class="font-weight-bold mb-1">Nhà xuất bản</h3>
                <p class="text-muted mb-0">Quản lý danh sách các đối tác nhà xuất bản cung cấp sách</p>
            </div>
            <div class="mt-3 mt-md-0">
                <router-link :to="{ name: 'admin-publisher-add' }" class="btn btn-warning text-dark font-weight-semibold">
                    <i class="fas fa-plus mr-1"></i> Thêm Nhà xuất bản
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
                                placeholder="Tìm kiếm theo mã, tên NXB, SĐT..." 
                            />
                            <div v-if="keyword" class="input-group-append">
                                <button class="btn btn-outline-secondary" @click="keyword = ''">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 text-md-right text-muted mt-2 mt-md-0 small">
                        Hiển thị <strong>{{ filteredPublishers.length }}</strong> / {{ publishers.length }} nhà xuất bản
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
                            <th>Mã NXB</th>
                            <th>Tên nhà xuất bản</th>
                            <th>Địa chỉ</th>
                            <th>Số điện thoại</th>
                            <th>Email</th>
                            <th class="text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="6" class="text-center py-5">
                                <div class="spinner-border text-primary spinner-border-sm mr-2"></div>
                                Đang tải danh sách nhà xuất bản...
                            </td>
                        </tr>
                        <tr v-else-if="filteredPublishers.length === 0">
                            <td colspan="6" class="text-center py-5 text-muted">
                                <i class="fas fa-building fa-2x mb-2 d-block text-muted"></i>
                                Không tìm thấy nhà xuất bản nào phù hợp.
                            </td>
                        </tr>
                        <tr v-else v-for="p in filteredPublishers" :key="p.publisherId">
                            <td class="font-weight-bold text-primary">{{ p.publisherId }}</td>
                            <td class="font-weight-semibold">{{ p.name }}</td>
                            <td class="small text-muted">{{ p.address }}</td>
                            <td>{{ p.phoneNumber }}</td>
                            <td class="small">{{ p.email || "-" }}</td>
                            <td class="text-center text-nowrap">
                                <router-link 
                                    :to="{ name: 'admin-publisher-detail', params: { id: p.publisherId } }" 
                                    class="btn btn-outline-info btn-sm mr-1"
                                    title="Xem chi tiết"
                                >
                                    <i class="fas fa-eye"></i>
                                </router-link>
                                <router-link 
                                    :to="{ name: 'admin-publisher-edit', params: { id: p.publisherId } }" 
                                    class="btn btn-outline-warning btn-sm mr-1"
                                    title="Chỉnh sửa"
                                >
                                    <i class="fas fa-edit"></i>
                                </router-link>
                                <button 
                                    class="btn btn-outline-danger btn-sm"
                                    title="Xóa NXB"
                                    @click="handleDelete(p.publisherId)"
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
