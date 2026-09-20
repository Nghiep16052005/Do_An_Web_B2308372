<script>
import AdminPublisherService from "@/services/admin/publisher.service";

export default {
    name: "AdminPublisherAdd",

    data() {
        return {
            formData: {
                publisherId: "",
                name: "",
                address: "",
                phoneNumber: "",
                email: ""
            },
            loading: false,
            errorMessage: ""
        };
    },

    methods: {
        async handleSubmit() {
            this.loading = true;
            this.errorMessage = "";

            try {
                const response = await AdminPublisherService.createPublisher(this.formData);

                if (response.success) {
                    this.$router.push({ name: "admin-publishers" });
                } else {
                    this.errorMessage = response.message || "Thêm nhà xuất bản thất bại.";
                }
            } catch (error) {
                console.error("Create publisher error:", error);
                this.errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi tạo nhà xuất bản.";
            } finally {
                this.loading = false;
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
                <h3 class="font-weight-bold mb-0">Thêm Nhà xuất bản</h3>
                <p class="text-muted small mb-0">Thêm đối tác nhà xuất bản mới vào hệ thống</p>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </div>

        <div class="card shadow-sm" style="max-width: 750px;">
            <div class="card-body p-4">
                <form @submit.prevent="handleSubmit">
                    <div class="row">
                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Mã Nhà xuất bản <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.publisherId" 
                                type="text" 
                                class="form-control" 
                                placeholder="Ví dụ: NXB01" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Tên Nhà xuất bản <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.name" 
                                type="text" 
                                class="form-control" 
                                placeholder="NXB Trẻ, NXB Kim Đồng..." 
                                required 
                            />
                        </div>

                        <div class="col-12 form-group">
                            <label class="font-weight-semibold">Địa chỉ <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.address" 
                                type="text" 
                                class="form-control" 
                                placeholder="Địa chỉ trụ sở NXB..." 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Số điện thoại <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.phoneNumber" 
                                type="tel" 
                                class="form-control" 
                                placeholder="028 1234 5678" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Email</label>
                            <input 
                                v-model.trim="formData.email" 
                                type="email" 
                                class="form-control" 
                                placeholder="contact@nxb.vn" 
                            />
                        </div>
                    </div>

                    <div class="mt-4 pt-3 border-top d-flex justify-content-end">
                        <router-link :to="{ name: 'admin-publishers' }" class="btn btn-secondary mr-2">
                            Hủy bỏ
                        </router-link>
                        <button type="submit" class="btn btn-warning text-dark font-weight-semibold" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm mr-1"></span>
                            <i v-else class="fas fa-save mr-1"></i> Lưu Nhà xuất bản
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
