<script>
import AdminAuthService from "@/services/admin/auth.service";

export default {
    name: "AdminHeader",

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
            <span class="text-muted d-none d-md-inline">
                <i class="fas fa-calendar-alt mr-1"></i> Hệ thống Quản trị Thư viện
            </span>
        </div>

        <div class="d-flex align-items-center">
            <div v-if="employee" class="d-flex align-items-center mr-3">
                <div class="avatar-circle mr-2">
                    <i class="fas fa-user-shield"></i>
                </div>
                <div>
                    <div class="font-weight-bold text-dark" style="font-size: 0.9rem;">
                        {{ employee.fullName || employee.username }}
                    </div>
                    <div class="text-muted" style="font-size: 0.75rem;">
                        {{ employee.position || "Nhân viên" }}
                    </div>
                </div>
            </div>

            <button 
                class="btn btn-outline-danger btn-sm" 
                title="Đăng xuất"
                @click="handleLogout"
            >
                <i class="fas fa-sign-out-alt mr-1"></i>
                Đăng xuất
            </button>
        </div>
    </header>
</template>
