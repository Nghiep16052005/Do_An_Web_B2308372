<script>
import AdminReaderService from "@/services/admin/reader.service";

export default {
    name: "AdminReaderEdit",

    data() {
        return {
            readerId: this.$route.params.id,
            formData: {
                fullName: "",
                dateOfBirth: "",
                gender: "Male",
                address: "",
                phoneNumber: "",
                email: "",
                status: "Active"
            },
            loading: false,
            saving: false,
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
                    const r = response.data;
                    let dobFormatted = "";
                    if (r.dateOfBirth) {
                        dobFormatted = new Date(r.dateOfBirth).toISOString().split("T")[0];
                    }
                    this.formData = {
                        fullName: r.fullName,
                        dateOfBirth: dobFormatted,
                        gender: r.gender,
                        address: r.address,
                        phoneNumber: r.phoneNumber,
                        email: r.email,
                        status: r.status
                    };
                } else {
                    this.errorMessage = response.message || "Không tìm thấy thông tin độc giả.";
                }
            } catch (error) {
                console.error("Get reader error:", error);
                this.errorMessage = "Không thể tải dữ liệu độc giả.";
            } finally {
                this.loading = false;
            }
        },

        async handleSubmit() {
            this.saving = true;
            this.errorMessage = "";

            try {
                const response = await AdminReaderService.updateReader(this.readerId, this.formData);

                if (response.success) {
                    this.$router.push({ name: "admin-readers" });
                } else {
                    this.errorMessage = response.message || "Cập nhật độc giả thất bại.";
                }
            } catch (error) {
                console.error("Update reader error:", error);
                this.errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi lưu thông tin độc giả.";
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
            <router-link :to="{ name: 'admin-readers' }" class="btn btn-outline-secondary btn-sm mr-3">
                <i class="fas fa-arrow-left mr-1"></i> Quay lại
            </router-link>
            <div>
                <h3 class="font-weight-bold mb-0">Chỉnh sửa thông tin độc giả</h3>
                <p class="text-muted small mb-0">Mã độc giả: <span class="font-weight-bold text-primary">{{ readerId }}</span></p>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Đang tải thông tin độc giả...</p>
        </div>

        <div v-else class="card shadow-sm" style="max-width: 800px;">
            <div class="card-body p-4">
                <form @submit.prevent="handleSubmit">
                    <div class="row">
                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Mã độc giả</label>
                            <input :value="readerId" type="text" class="form-control" disabled />
                            <small class="text-muted">Mã độc giả không thể thay đổi</small>
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Họ và tên <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.fullName" 
                                type="text" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Ngày sinh <span class="text-danger">*</span></label>
                            <input 
                                v-model="formData.dateOfBirth" 
                                type="date" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Giới tính <span class="text-danger">*</span></label>
                            <select v-model="formData.gender" class="form-control" required>
                                <option value="Male">Nam</option>
                                <option value="Female">Nữ</option>
                                <option value="Other">Khác</option>
                            </select>
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

                        <div class="col-md-8 form-group">
                            <label class="font-weight-semibold">Địa chỉ <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.address" 
                                type="text" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-md-4 form-group">
                            <label class="font-weight-semibold">Trạng thái <span class="text-danger">*</span></label>
                            <select v-model="formData.status" class="form-control" required>
                                <option value="Active">Hoạt động</option>
                                <option value="Inactive">Tạm khóa</option>
                            </select>
                        </div>
                    </div>

                    <div class="mt-4 pt-3 border-top d-flex justify-content-end">
                        <router-link :to="{ name: 'admin-readers' }" class="btn btn-secondary mr-2">
                            Hủy bỏ
                        </router-link>
                        <button type="submit" class="btn btn-primary font-weight-semibold" :disabled="saving">
                            <span v-if="saving" class="spinner-border spinner-border-sm mr-1"></span>
                            <i v-else class="fas fa-save mr-1"></i> Cập nhật thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
