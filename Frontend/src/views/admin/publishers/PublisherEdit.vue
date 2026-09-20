<script>
import AdminPublisherService from "@/services/admin/publisher.service";

export default {
    name: "AdminPublisherEdit",

    data() {
        return {
            publisherId: this.$route.params.id,
            formData: {
                name: "",
                address: "",
                phoneNumber: "",
                email: ""
            },
            loading: false,
            saving: false,
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
                    const p = response.data;
                    this.formData = {
                        name: p.name,
                        address: p.address,
                        phoneNumber: p.phoneNumber,
                        email: p.email || ""
                    };
                } else {
                    this.errorMessage = response.message || "Không tìm thấy thông tin nhà xuất bản.";
                }
            } catch (error) {
                console.error("Get publisher error:", error);
                this.errorMessage = "Không thể tải dữ liệu nhà xuất bản.";
            } finally {
                this.loading = false;
            }
        },

        async handleSubmit() {
            this.saving = true;
            this.errorMessage = "";

            try {
                const response = await AdminPublisherService.updatePublisher(this.publisherId, this.formData);

                if (response.success) {
                    this.$router.push({ name: "admin-publishers" });
                } else {
                    this.errorMessage = response.message || "Cập nhật nhà xuất bản thất bại.";
                }
            } catch (error) {
                console.error("Update publisher error:", error);
                this.errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi lưu thông tin NXB.";
            } finally {
                this.saving = false;
            }
        }
    }
};
</script>

<template>
    <div>
        <div class="d-flex align-items-center mb-4">
            <router-link :to="{ name: 'admin-publishers' }" class="btn btn-outline-secondary btn-sm mr-3">
                <i class="fas fa-arrow-left mr-1"></i> Quay lại
            </router-link>
            <div>
                <h3 class="font-weight-bold mb-0">Chỉnh sửa Nhà xuất bản</h3>
                <p class="text-muted small mb-0">Mã NXB: <span class="font-weight-bold text-primary">{{ publisherId }}</span></p>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Đang tải thông tin NXB...</p>
        </div>

        <div v-else class="card shadow-sm" style="max-width: 750px;">
            <div class="card-body p-4">
                <form @submit.prevent="handleSubmit">
                    <div class="row">
                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Mã Nhà xuất bản</label>
                            <input :value="publisherId" type="text" class="form-control" disabled />
                            <small class="text-muted">Mã NXB không thể thay đổi</small>
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Tên Nhà xuất bản <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.name" 
                                type="text" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-12 form-group">
                            <label class="font-weight-semibold">Địa chỉ <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.address" 
                                type="text" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Số điện thoại <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.phoneNumber" 
                                type="tel" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Email</label>
                            <input 
                                v-model.trim="formData.email" 
                                type="email" 
                                class="form-control" 
                            />
                        </div>
                    </div>

                    <div class="mt-4 pt-3 border-top d-flex justify-content-end">
                        <router-link :to="{ name: 'admin-publishers' }" class="btn btn-secondary mr-2">
                            Hủy bỏ
                        </router-link>
                        <button type="submit" class="btn btn-primary font-weight-semibold" :disabled="saving">
                            <span v-if="saving" class="spinner-border spinner-border-sm mr-1"></span>
                            <i v-else class="fas fa-save mr-1"></i> Cập nhật NXB
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
