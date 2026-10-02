<script>
import AdminAuthService from "@/services/admin/auth.service";
import NotificationDropdown from "@/components/common/NotificationDropdown.vue";

export default {
    name: "AdminHeader",

    components: {
        NotificationDropdown
    },

    data() {
        return {
            employee: null
        };
    },

    mounted() {
        this.employee = AdminAuthService.getCurrentEmployee();
    },

    methods: {
        async handleLogout() {
            if (!confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
                return;
            }
            try {
                await AdminAuthService.logout();
            } catch (error) {
                console.error("Logout error:", error);
            } finally {
                this.$router.push({ name: "admin-login" });
            }
        }
    }
};
</script>

<template>
    <header class="admin-header">
        <div class="d-flex align-items-center">
            <span class="text-muted d-none d-md-inline font-weight-semibold">
                <i class="fas fa-shield-alt mr-1 text-primary"></i> Hệ thống Quản trị Thư viện
            </span>
        </div>

        <div class="d-flex align-items-center">
            <!-- Chuông thông báo -->
            <NotificationDropdown role="admin" />

            <!-- Xin chào [Tên] -->
            <div v-if="employee" class="d-flex align-items-center mr-3 pl-2 border-left">
                <div class="avatar-circle mr-2 bg-primary text-white">
                    <i class="fas fa-user-shield"></i>
                </div>
                <div>
                    <div class="font-weight-bold text-dark" style="font-size: 0.9rem;">
                        Xin chào, {{ employee.fullName || employee.username }}
                    </div>
                    <div class="text-muted" style="font-size: 0.75rem;">
                        {{ employee.position || "Quản trị viên" }}
                    </div>
                </div>
            </div>

            <!-- Nút đăng xuất màu đỏ có xác nhận -->
            <button 
                class="btn btn-danger btn-sm font-weight-semibold px-3 shadow-sm" 
                title="Đăng xuất khỏi hệ thống"
                @click="handleLogout"
            >
                <i class="fas fa-sign-out-alt mr-1"></i>
                Đăng xuất
            </button>
        </div>
    </header>
</template>

<style scoped>
.avatar-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
}
</style>
