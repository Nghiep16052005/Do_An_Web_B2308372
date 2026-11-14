<script>
import AdminAuthService from "@/services/admin/auth.service";
import NotificationDropdown from "@/components/common/NotificationDropdown.vue";

export default {
    name: "AdminHeader",

    components: {
        NotificationDropdown
    },

    props: {
        collapsed: {
            type: Boolean,
            default: false
        }
    },

    emits: ["toggle-sidebar"],

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
    <header class="admin-header sticky-top">
        <div class="d-flex align-items-center flex-nowrap">
            <!-- Nút Toggle Sidebar phong cách YouTube -->
            <button 
                type="button" 
                class="btn btn-light btn-sm mr-3 shadow-sm border sidebar-toggle-btn"
                title="Thu gọn / Mở rộng menu"
                @click="$emit('toggle-sidebar')"
                style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px;"
            >
                <i class="fas fa-bars"></i>
            </button>
            <span class="text-dark font-weight-bold d-none d-sm-inline" style="font-size: 0.95rem;">
                <i class="fas fa-shield-alt mr-1 text-primary"></i> Hệ thống Quản trị Thư viện
            </span>
        </div>

        <div class="header-user-actions d-flex align-items-center flex-nowrap flex-shrink-0">
            <!-- Chuông thông báo -->
            <NotificationDropdown role="admin" />

            <!-- Xin chào [Tên] -->
            <div v-if="employee" class="d-flex align-items-center mr-2 mr-md-3 pl-2 pl-md-3 border-left text-nowrap flex-shrink-0">
                <div class="avatar-circle mr-2 bg-primary text-white shadow-sm flex-shrink-0" style="width: 34px; height: 34px; min-width: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem;">
                    <i class="fas fa-user-shield"></i>
                </div>
                <div class="d-none d-md-block text-nowrap">
                    <div class="font-weight-bold text-dark" style="font-size: 0.88rem; line-height: 1.2;">
                        Xin chào, {{ employee.fullName || employee.username }}
                    </div>
                    <div class="text-muted" style="font-size: 0.72rem;">
                        {{ employee.position || "Quản trị viên" }}
                    </div>
                </div>
            </div>

            <!-- Nút đăng xuất -->
            <button 
                class="btn btn-danger btn-sm font-weight-semibold px-2 px-sm-3 shadow-sm text-nowrap flex-shrink-0" 
                title="Đăng xuất khỏi hệ thống"
                @click="handleLogout"
            >
                <i class="fas fa-sign-out-alt mr-1"></i>
                <span class="d-none d-sm-inline">Đăng xuất</span>
            </button>
        </div>
    </header>
</template>

<style scoped>
.sidebar-toggle-btn:hover {
    background-color: #e2e8f0;
}

.avatar-circle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
}
</style>
