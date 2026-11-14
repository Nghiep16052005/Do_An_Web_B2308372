<script>
import ClientAuthService from "@/services/client/auth.service";

export default {
    name: "ClientLogin",

    data() {
        return {
            readerId: "",
            phoneNumber: "",
            showPassword: false,
            loading: false,
            errorMessage: ""
        };
    },

    mounted() {
        // Dọn dẹp dữ liệu lưu thủ công trong localStorage trước đây nếu có
        localStorage.removeItem("saved_reader_id");
        localStorage.removeItem("saved_reader_phone");
        localStorage.removeItem("remember_reader");
    },

    methods: {
        async handleLogin() {
            this.loading = true;
            this.errorMessage = "";

            try {
                const response = await ClientAuthService.login({
                    readerId: this.readerId,
                    phoneNumber: this.phoneNumber
                });

                if (response.success) {
                    const redirect = this.$route.query.redirect || "/";
                    this.$router.push(redirect);
                } else {
                    this.errorMessage = response.message || "Mã độc giả hoặc số điện thoại không chính xác.";
                }
            } catch (error) {
                console.error("Reader login error:", error);
                this.errorMessage = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>

<template>
    <div class="row justify-content-center my-5">
        <div class="col-md-6 col-lg-5">
            <div class="card shadow-sm p-4" style="border-radius: 12px;">
                <div class="text-center mb-4">
                    <div class="avatar-circle mx-auto mb-3 bg-primary text-white" style="width: 58px; height: 58px; font-size: 1.6rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-book-reader"></i>
                    </div>
                    <h3 class="font-weight-bold text-dark">Đăng nhập Độc giả</h3>
                    <p class="text-muted small">Nhập mã độc giả và số điện thoại đã đăng ký để tra cứu và mượn sách</p>
                </div>

                <div v-if="errorMessage" class="alert alert-danger py-2 small">
                    <i class="fas fa-exclamation-triangle mr-1"></i> {{ errorMessage }}
                </div>

                <form @submit.prevent="handleLogin" autocomplete="on">
                    <div class="form-group mb-3">
                        <label class="font-weight-semibold small text-muted">Mã độc giả <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <span class="input-group-text bg-light"><i class="fas fa-id-card text-primary"></i></span>
                            </div>
                            <input 
                                id="readerId"
                                name="username"
                                v-model.trim="readerId" 
                                type="text" 
                                class="form-control" 
                                placeholder="Ví dụ: R001" 
                                autocomplete="username"
                                required 
                            />
                        </div>
                    </div>

                    <div class="form-group mb-4">
                        <label class="font-weight-semibold small text-muted">Số điện thoại <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <span class="input-group-text bg-light"><i class="fas fa-lock text-primary"></i></span>
                            </div>
                            <input 
                                id="phoneNumber"
                                name="password"
                                v-model.trim="phoneNumber" 
                                :type="showPassword ? 'text' : 'password'" 
                                class="form-control" 
                                placeholder="Nhập số điện thoại" 
                                autocomplete="current-password"
                                required 
                            />
                            <div class="input-group-append">
                                <button 
                                    type="button" 
                                    class="btn btn-outline-secondary" 
                                    @click="showPassword = !showPassword"
                                    tabindex="-1"
                                    :title="showPassword ? 'Ẩn số điện thoại' : 'Hiện số điện thoại'"
                                >
                                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        class="btn btn-primary btn-block py-2 font-weight-bold shadow-sm" 
                        :disabled="loading"
                    >
                        <span v-if="loading" class="spinner-border spinner-border-sm mr-1"></span>
                        <i v-else class="fas fa-sign-in-alt mr-1"></i>
                        Đăng nhập
                    </button>
                </form>

                <div class="text-center mt-4 pt-3 border-top">
                    <router-link to="/" class="text-muted small">
                        <i class="fas fa-arrow-left mr-1"></i> Quay lại trang chủ
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>
