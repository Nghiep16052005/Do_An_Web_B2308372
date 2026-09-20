<script>
import AdminReaderService from "@/services/admin/reader.service";

export default {
    name: "AdminReaderAdd",

    data() {
        return {
            formData: {
                readerId: "",
                fullName: "",
                dateOfBirth: "",
                gender: "Male",
                address: "",
                phoneNumber: "",
                email: "",
                status: "Active"
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
                const response = await AdminReaderService.createReader(this.formData);

                if (response.success) {
                    this.$router.push({ name: "admin-readers" });
                } else {
                    this.errorMessage = response.message || "Thêm độc giả thất bại.";
                }
            } catch (error) {
                console.error("Create reader error:", error);
                this.errorMessage = error.response?.data?.message || "Đã có lỗi xảy ra khi tạo độc giả.";
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
            <router-link :to="{ name: 'admin-readers' }" class="btn btn-outline-secondary btn-sm mr-3">
                <i class="fas fa-arrow-left mr-1"></i> Quay lại
            </router-link>
            <div>
                <h3 class="font-weight-bold mb-0">Thêm độc giả mới</h3>
                <p class="text-muted small mb-0">Tạo hồ sơ độc giả để cấp quyền mượn sách</p>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </div>

        <div class="card shadow-sm" style="max-width: 800px;">
            <div class="card-body p-4">
                <form @submit.prevent="handleSubmit">
                    <div class="row">
                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Mã độc giả <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.readerId" 
                                type="text" 
                                class="form-control" 
                                placeholder="Ví dụ: DG001" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Họ và tên <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.fullName" 
                                type="text" 
                                class="form-control" 
                                placeholder="Nguyễn Văn A" 
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
                                placeholder="0901234567" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Email</label>
                            <input 
                                v-model.trim="formData.email" 
                                type="email" 
                                class="form-control" 
                                placeholder="example@ctu.edu.vn" 
                            />
                        </div>

                        <div class="col-md-8 form-group">
                            <label class="font-weight-semibold">Địa chỉ <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.address" 
                                type="text" 
                                class="form-control" 
                                placeholder="Địa chỉ thường trú..." 
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
                        <button type="submit" class="btn btn-success font-weight-semibold" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm mr-1"></span>
                            <i v-else class="fas fa-save mr-1"></i> Lưu độc giả
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
