<script>
import ClientAuthService from "@/services/client/auth.service";

export default {
    name: "ClientHeader",

    data() {
        return {
            reader: null
        };
    },

    mounted() {
        this.reader = ClientAuthService.getCurrentReader();
    },

    methods: {
        async handleLogout() {
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
        <nav class="navbar navbar-expand-lg navbar-light app-navbar">
            <div class="container">
                <router-link to="/" class="navbar-brand">
                    <i class="fas fa-book-open text-primary"></i>
                    <span>Thư Viện Sách</span>
                </router-link>

                <button 
                    class="navbar-toggler" 
                    type="button" 
                    data-toggle="collapse" 
                    data-target="#clientNavbar"
                >
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="clientNavbar">
                    <ul class="navbar-nav mr-auto">
                        <li class="nav-item">
                            <router-link 
                                :to="{ name: 'client-home' }" 
                                class="nav-link" 
                                exact-active-class="active font-weight-bold text-primary"
                            >
                                <i class="fas fa-home mr-1"></i> Trang chủ
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link 
                                :to="{ name: 'client-books' }" 
                                class="nav-link" 
                                active-class="active font-weight-bold text-primary"
                            >
                                <i class="fas fa-book mr-1"></i> Tra cứu sách
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link 
                                :to="{ name: 'client-borrow-records' }" 
                                class="nav-link" 
                                active-class="active font-weight-bold text-primary"
                            >
                                <i class="fas fa-history mr-1"></i> Sách đang mượn
                            </router-link>
                        </li>
                    </ul>

                    <ul class="navbar-nav ml-auto align-items-center">
                        <li v-if="reader" class="nav-item d-flex align-items-center mr-3">
                            <div class="avatar-circle mr-2" style="width: 32px; height: 32px; font-size: 0.85rem;">
                                <i class="fas fa-user"></i>
                            </div>
                            <span class="font-weight-bold text-dark mr-2">
                                {{ reader.fullName }}
                            </span>
                            <button 
                                class="btn btn-outline-danger btn-sm"
                                @click="handleLogout"
                            >
                                <i class="fas fa-sign-out-alt mr-1"></i> Đăng xuất
                            </button>
                        </li>

                        <li v-else class="nav-item">
                            <router-link 
                                :to="{ name: 'client-login' }" 
                                class="btn btn-primary btn-sm px-3"
                            >
                                <i class="fas fa-sign-in-alt mr-1"></i> Đăng nhập Độc giả
                            </router-link>
                        </li>

                        <li class="nav-item ml-2">
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
