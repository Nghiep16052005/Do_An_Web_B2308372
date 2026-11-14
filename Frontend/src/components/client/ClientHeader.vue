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
    <header class="client-header sticky-top">
        <nav class="navbar navbar-expand-lg navbar-light app-navbar py-2 px-3 px-md-4 px-xl-5">
            <!-- 1. Logo & Tên Thư Viện -->
            <router-link to="/" class="navbar-brand mr-3 mr-xl-4 text-nowrap d-flex align-items-center flex-shrink-0">
                <i class="fas fa-book-open text-primary mr-2" style="font-size: 1.35rem;"></i>
                <span class="font-weight-bold text-dark logo-title" style="letter-spacing: -0.2px;">Thư Viện Sách</span>
            </router-link>

            <!-- 2. Cụm tương tác bên phải (Chuông, Thông tin, Đăng xuất, Cổng Admin) - Luôn cố định 1 hàng như YouTube -->
            <div class="header-user-actions d-flex align-items-center flex-nowrap flex-shrink-0 ml-auto order-lg-3">
                <!-- Khi độc giả đã đăng nhập -->
                <template v-if="reader">
                    <!-- Chuông thông báo -->
                    <NotificationDropdown role="client" :readerId="reader.readerId" />

                    <!-- Thông tin độc giả -->
                    <div class="d-flex align-items-center mr-2 mr-md-3 pl-2 pl-md-3 border-left text-nowrap flex-shrink-0">
                        <div class="avatar-circle mr-2 bg-primary text-white shadow-sm flex-shrink-0" style="width: 34px; height: 34px; min-width: 34px; font-size: 0.85rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-user"></i>
                        </div>
                        <span class="font-weight-bold text-dark text-nowrap d-none d-sm-inline" style="font-size: 0.88rem;">
                            Xin chào, {{ reader.fullName }}
                        </span>
                    </div>

                    <!-- Nút Đăng xuất -->
                    <button 
                        class="btn btn-danger btn-sm font-weight-semibold px-2 px-sm-3 shadow-sm text-nowrap mr-2 flex-shrink-0"
                        title="Đăng xuất khỏi hệ thống"
                        @click="handleLogout"
                    >
                        <i class="fas fa-sign-out-alt mr-1"></i>
                        <span class="d-none d-md-inline">Đăng xuất</span>
                    </button>
                </template>

                <!-- Khi chưa đăng nhập -->
                <template v-else>
                    <router-link 
                        :to="{ name: 'client-login' }" 
                        class="btn btn-primary btn-sm px-3 shadow-sm font-weight-semibold text-nowrap mr-2 flex-shrink-0"
                    >
                        <i class="fas fa-sign-in-alt mr-1"></i>
                        <span class="d-none d-sm-inline">Đăng nhập Độc giả</span>
                        <span class="d-inline d-sm-none">Đăng nhập</span>
                    </router-link>
                </template>

                <!-- Nút Cổng Quản trị viên (Luôn luôn nằm cố định cùng hàng bên phải, KHÔNG BAO GIỜ BỊ RỚT DÒNG!) -->
                <router-link 
                    to="/admin/login" 
                    class="btn btn-outline-secondary btn-sm flex-shrink-0 shadow-sm"
                    title="Cổng quản trị viên"
                    style="padding: 0.35rem 0.65rem;"
                >
                    <i class="fas fa-user-shield text-dark"></i>
                </router-link>
            </div>

            <!-- 3. Nút menu di động (Hamburger) cho màn hình nhỏ -->
            <button 
                class="navbar-toggler d-lg-none ml-2" 
                type="button" 
                data-toggle="collapse" 
                data-target="#clientNavbar"
                aria-controls="clientNavbar" 
                aria-expanded="false" 
                aria-label="Toggle navigation"
            >
                <span class="navbar-toggler-icon"></span>
            </button>

            <!-- 4. Danh sách menu chính (Nằm ở giữa trên Desktop, bung xuống dưới trên Mobile) -->
            <div class="collapse navbar-collapse order-lg-2 flex-grow-1" id="clientNavbar">
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
            </div>
        </nav>
    </header>
</template>

<style scoped>
.client-header {
    z-index: 1025;
}

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

.header-user-actions {
    display: flex !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
}
</style>
