<script>
import ClientAuthService from "@/services/client/auth.service";
import NotificationDropdown from "@/components/common/NotificationDropdown.vue";

export default {
    name: "ClientHeader",

    components: {
        NotificationDropdown
    },

    data() {
        return {
            reader: null
        };
    },

    watch: {
        $route() {
            this.syncReader();
        }
    },

    mounted() {
        this.syncReader();
        window.addEventListener("reader-auth-change", this.syncReader);
    },

    beforeUnmount() {
        window.removeEventListener("reader-auth-change", this.syncReader);
    },

    methods: {
        syncReader() {
            this.reader = ClientAuthService.getCurrentReader();
        },

        async handleLogout() {
            if (!confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
                return;
            }
            try {
                await ClientAuthService.logout();
            } catch (error) {
                console.error("Logout error:", error);
            } finally {
                this.reader = null;
                this.$router.push({ name: "client-login" });
            }
        }
    }
};
</script>

<template>
    <header>
        <nav class="navbar navbar-expand-lg navbar-light app-navbar py-2 px-0">
            <div class="container">
                <!-- Logo & Tên Thư Viện -->
                <router-link to="/" class="navbar-brand mr-3 mr-xl-4 text-nowrap d-flex align-items-center">
                    <i class="fas fa-book-open text-primary mr-2" style="font-size: 1.3rem;"></i>
                    <span class="font-weight-bold text-dark" style="letter-spacing: -0.2px;">Thư Viện Sách</span>
                </router-link>

                <button 
                    class="navbar-toggler" 
                    type="button" 
                    data-toggle="collapse" 
                    data-target="#clientNavbar"
                    aria-controls="clientNavbar" 
                    aria-expanded="false" 
                    aria-label="Toggle navigation"
                >
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="clientNavbar">
                    <!-- Danh sách menu chính (Chỉ 1 mục Trả sách, cố định 1 dòng) -->
                    <ul class="navbar-nav mr-auto align-items-lg-center">
                        <li class="nav-item">
                            <router-link 
                                :to="{ name: 'client-home' }" 
                                class="nav-link text-nowrap px-2 px-xl-3" 
                                exact-active-class="active font-weight-bold text-primary"
                            >
                                <i class="fas fa-home mr-1"></i>Trang chủ
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link 
                                :to="{ name: 'client-books' }" 
                                class="nav-link text-nowrap px-2 px-xl-3" 
                                active-class="active font-weight-bold text-primary"
                            >
                                <i class="fas fa-book mr-1"></i>Tra cứu sách
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link 
                                :to="{ name: 'client-borrow-records' }" 
                                class="nav-link text-nowrap px-2 px-xl-3" 
                                active-class="active font-weight-bold text-primary"
                            >
                                <i class="fas fa-history mr-1"></i>Sách đang mượn
                            </router-link>
                        </li>
                        <!-- Duy nhất 1 mục Trả sách trên thanh menu -->
                        <li class="nav-item">
                            <router-link 
                                :to="{ name: 'client-return-books' }" 
                                class="nav-link text-nowrap px-2 px-xl-3" 
                                active-class="active font-weight-bold text-success"
                            >
                                <i class="fas fa-undo-alt mr-1"></i>Trả sách
                            </router-link>
                        </li>
                    </ul>

                    <!-- Khu vực người dùng bên phải -->
                    <ul class="navbar-nav ml-auto align-items-center flex-row flex-wrap">
                        <li v-if="reader" class="nav-item d-flex align-items-center my-1 my-lg-0">
                            <!-- Chuông thông báo phía Client với badge số đếm -->
                            <NotificationDropdown role="client" :readerId="reader.readerId" />

                            <!-- Thông tin độc giả (Cố định 1 dòng, không xuống hàng) -->
                            <div class="d-flex align-items-center mr-3 pl-3 border-left text-nowrap">
                                <div class="avatar-circle mr-2 bg-primary text-white shadow-sm" style="width: 34px; height: 34px; min-width: 34px; font-size: 0.85rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-user"></i>
                                </div>
                                <span class="font-weight-bold text-dark text-nowrap" style="font-size: 0.9rem;">
                                    Xin chào, {{ reader.fullName }}
                                </span>
                            </div>

                            <!-- Nút Đăng xuất màu đỏ (Cố định 1 dòng không bị ngắt) -->
                            <button 
                                class="btn btn-danger btn-sm font-weight-semibold px-3 shadow-sm text-nowrap ml-1"
                                title="Đăng xuất khỏi hệ thống"
                                style="white-space: nowrap;"
                                @click="handleLogout"
                            >
                                <i class="fas fa-sign-out-alt mr-1"></i>Đăng xuất
                            </button>
                        </li>

                        <li v-else class="nav-item d-flex align-items-center my-1 my-lg-0">
                            <router-link 
                                :to="{ name: 'client-login' }" 
                                class="btn btn-primary btn-sm px-3 shadow-sm font-weight-semibold text-nowrap"
                                style="white-space: nowrap;"
                            >
                                <i class="fas fa-sign-in-alt mr-1"></i>Đăng nhập Độc giả
                            </router-link>
                        </li>

                        <li class="nav-item ml-2 my-1 my-lg-0">
                            <router-link 
                                to="/admin/login" 
                                class="btn btn-outline-secondary btn-sm"
                                title="Cổng quản trị viên"
                            >
                                <i class="fas fa-user-shield"></i>
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>
</template>

<style scoped>
.app-navbar {
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border-bottom: 1px solid #e2e8f0;
}

/* Đảm bảo tất cả liên kết trên navbar luôn nằm gọn gàng trên 1 dòng */
.navbar-nav .nav-link {
    white-space: nowrap;
    font-size: 0.92rem;
    font-weight: 500;
    color: #4b5563;
    transition: color 0.15s ease-in-out;
}

.navbar-nav .nav-link:hover {
    color: #2563eb;
}

.navbar-nav .nav-link.active {
    color: #2563eb !important;
}

.text-nowrap {
    white-space: nowrap !important;
}
</style>
