<script>
import ClientAuthService from "@/services/client/auth.service";

export default {
    name: "ClientLogin",

    data() {
        return {
            readerId: "",
            phoneNumber: "",
            rememberMe: true,
            hasSavedCredentials: false,
            loading: false,
            errorMessage: ""
        };
    },

    mounted() {
        this.loadSavedCredentials();
    },

    methods: {
        loadSavedCredentials() {
            const saved = ClientAuthService.getSavedCredentials();
            if (saved && (saved.readerId || saved.phoneNumber)) {
                this.readerId = saved.readerId;
                this.phoneNumber = saved.phoneNumber;
                this.rememberMe = saved.remember;
                this.hasSavedCredentials = true;
            } else {
                // Tự động điền thông tin độc giả mẫu R001 tiện lợi
                this.readerId = "R001";
                this.phoneNumber = "0901234567";
                this.rememberMe = true;
            }
        },

        useSampleAccount() {
            this.readerId = "R001";
            this.phoneNumber = "0901234567";
            this.rememberMe = true;
            this.errorMessage = "";
        },

        clearSaved() {
            ClientAuthService.saveCredentials("", "", false);
            this.readerId = "";
            this.phoneNumber = "";
            this.rememberMe = false;
            this.hasSavedCredentials = false;
        },

        async handleLogin() {
            this.loading = true;
            this.errorMessage = "";

            try {
                const response = await ClientAuthService.login({
                    readerId: this.readerId,
                    phoneNumber: this.phoneNumber
                });

                if (response.success) {
                    // Lưu thông tin đăng nhập vào trình duyệt theo lựa chọn
                    ClientAuthService.saveCredentials(
                        this.readerId, 
                        this.phoneNumber, 
                        this.rememberMe
                    );

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

                <!-- Thẻ trạng thái thông tin đã lưu -->
                <div v-if="hasSavedCredentials" class="d-flex align-items-center justify-content-between mb-3 px-3 py-2 bg-light rounded small border">
                    <div>
                        <i class="fas fa-save text-success mr-1"></i>
                        Đã lưu: <strong>{{ readerId }}</strong> ({{ phoneNumber }})
                    </div>
                    <button 
                        type="button" 
                        class="btn btn-link btn-sm p-0 text-danger text-decoration-none small"
                        @click="clearSaved"
                        title="Xoá thông tin đã lưu"
                    >
                        <i class="fas fa-trash-alt mr-1"></i> Xoá
                    </button>
                </div>

                <div v-if="errorMessage" class="alert alert-danger py-2 small">
                    <i class="fas fa-exclamation-triangle mr-1"></i> {{ errorMessage }}
                </div>

                <form @submit.prevent="handleLogin">
                    <div class="form-group mb-3">
                        <label class="font-weight-semibold small text-muted">Mã độc giả <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <span class="input-group-text bg-light"><i class="fas fa-id-card text-primary"></i></span>
                            </div>
                            <input 
                                v-model.trim="readerId" 
                                type="text" 
                                class="form-control" 
                                placeholder="Ví dụ: R001" 
                                required 
                            />
                        </div>
                    </div>

                    <div class="form-group mb-3">
                        <label class="font-weight-semibold small text-muted">Số điện thoại <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <span class="input-group-text bg-light"><i class="fas fa-phone text-primary"></i></span>
                            </div>
                            <input 
                                v-model.trim="phoneNumber" 
                                type="tel" 
                                class="form-control" 
                                placeholder="Ví dụ: 0901234567" 
                                required 
                            />
                        </div>
                    </div>

                    <!-- Tùy chọn lưu trên trình duyệt -->
                    <div class="custom-control custom-checkbox mb-3">
                        <input 
                            type="checkbox" 
                            class="custom-control-input" 
                            id="rememberLogin"
                            v-model="rememberMe"
                        />
                        <label class="custom-control-label small text-dark font-weight-medium" for="rememberLogin" style="cursor: pointer;">
                            <i class="fas fa-shield-alt text-success mr-1"></i> Ghi nhớ đăng nhập trên trình duyệt này
                        </label>
                    </div>

                    <!-- Nút tài khoản mẫu nhanh -->
                    <div class="mb-3 text-right">
                        <button 
                            type="button" 
                            class="btn btn-outline-info btn-sm font-weight-medium py-1 px-2"
                            style="font-size: 0.8rem;"
                            @click="useSampleAccount"
                        >
                            <i class="fas fa-magic mr-1"></i> Điền nhanh tài khoản: R001 - 0901234567
                        </button>
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
