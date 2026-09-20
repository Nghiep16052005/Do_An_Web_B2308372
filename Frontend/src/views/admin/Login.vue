<script>
import AdminAuthService from "@/services/admin/auth.service";

export default {
    name: "AdminLogin",

    data() {
        return {
            username: "",
            password: "",
            loading: false,
            errorMessage: ""
        };
    },

    methods: {
        async handleLogin() {
            this.loading = true;
            this.errorMessage = "";

            try {
                const response = await AdminAuthService.login({
                    username: this.username,
                    password: this.password
                });

                if (response.success) {
                    const redirect = this.$route.query.redirect || "/admin/dashboard";
                    this.$router.push(redirect);
                } else {
                    this.errorMessage = response.message || "Tài khoản hoặc mật khẩu không chính xác.";
                }
            } catch (error) {
                console.error("Login error:", error);
                this.errorMessage = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>

<template>
    <div class="d-flex align-items-center justify-content-center" style="min-height: 100vh; background: #0f172a;">
        <div class="card shadow-lg p-4" style="max-width: 420px; width: 100%; border-radius: 16px;">
            <div class="text-center mb-4">
                <div class="avatar-circle mx-auto mb-3" style="width: 54px; height: 54px; font-size: 1.5rem;">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3 class="font-weight-bold text-dark">Đăng nhập Quản trị</h3>
                <p class="text-muted small">Cổng quản lý hệ thống Thư viện</p>
            </div>

            <div v-if="errorMessage" class="alert alert-danger py-2 small">
                <i class="fas fa-exclamation-triangle mr-1"></i> {{ errorMessage }}
            </div>

            <form @submit.prevent="handleLogin">
                <div class="form-group mb-3">
                    <label class="font-weight-semibold small text-muted">Tên đăng nhập</label>
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text"><i class="fas fa-user"></i></span>
                        </div>
                        <input 
                            v-model="username" 
                            type="text" 
                            class="form-control" 
                            placeholder="Nhập username" 
                            required 
                        />
                    </div>
                </div>

                <div class="form-group mb-4">
                    <label class="font-weight-semibold small text-muted">Mật khẩu</label>
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text"><i class="fas fa-lock"></i></span>
                        </div>
                        <input 
                            v-model="password" 
                            type="password" 
                            class="form-control" 
                            placeholder="Nhập mật khẩu" 
                            required 
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    class="btn btn-primary btn-block py-2 font-weight-bold" 
                    :disabled="loading"
                >
                    <span v-if="loading" class="spinner-border spinner-border-sm mr-1"></span>
                    <i v-else class="fas fa-sign-in-alt mr-1"></i>
                    Đăng nhập
                </button>
            </form>

            <div class="text-center mt-4 pt-3 border-top">
                <router-link to="/" class="text-muted small">
                    <i class="fas fa-arrow-left mr-1"></i> Quay lại trang bạn đọc
                </router-link>
            </div>
        </div>
    </div>
</template>
