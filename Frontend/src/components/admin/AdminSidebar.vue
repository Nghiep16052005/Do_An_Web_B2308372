<script>
export default {
    name: "AdminSidebar",

    props: {
        collapsed: {
            type: Boolean,
            default: false
        }
    }
};
</script>

<template>
    <aside class="admin-sidebar" :class="{ 'collapsed': collapsed }">
        <div class="sidebar-brand text-nowrap">
            <i class="fas fa-book-reader text-primary" style="font-size: 1.35rem;"></i>
            <span v-if="!collapsed" class="font-weight-bold ml-1">ADMIN PORTAL</span>
        </div>

        <nav class="nav flex-column mt-3">
            <router-link 
                :to="{ name: 'admin-dashboard' }" 
                class="nav-link text-nowrap"
                active-class="active"
                :title="collapsed ? 'Bảng điều khiển' : ''"
            >
                <i class="fas fa-chart-line fa-fw"></i>
                <span v-if="!collapsed">Bảng điều khiển</span>
            </router-link>

            <router-link 
                :to="{ name: 'admin-books' }" 
                class="nav-link text-nowrap"
                active-class="active"
                :title="collapsed ? 'Quản lý Sách' : ''"
            >
                <i class="fas fa-book fa-fw"></i>
                <span v-if="!collapsed">Quản lý Sách</span>
            </router-link>

            <router-link 
                :to="{ name: 'admin-readers' }" 
                class="nav-link text-nowrap"
                active-class="active"
                :title="collapsed ? 'Quản lý Độc giả' : ''"
            >
                <i class="fas fa-users fa-fw"></i>
                <span v-if="!collapsed">Quản lý Độc giả</span>
            </router-link>

            <router-link 
                :to="{ name: 'admin-publishers' }" 
                class="nav-link text-nowrap"
                active-class="active"
                :title="collapsed ? 'Nhà xuất bản' : ''"
            >
                <i class="fas fa-building fa-fw"></i>
                <span v-if="!collapsed">Nhà xuất bản</span>
            </router-link>

            <router-link 
                :to="{ name: 'admin-borrow-records' }" 
                class="nav-link text-nowrap"
                active-class="active"
                :title="collapsed ? 'Mượn trả sách' : ''"
            >
                <i class="fas fa-clipboard-list fa-fw"></i>
                <span v-if="!collapsed">Mượn trả sách</span>
            </router-link>

            <router-link 
                :to="{ name: 'admin-penalties' }" 
                class="nav-link text-nowrap"
                active-class="active"
                :title="collapsed ? 'Vi phạm & Tiền phạt' : ''"
            >
                <i class="fas fa-file-invoice-dollar fa-fw"></i>
                <span v-if="!collapsed">Vi phạm & Tiền phạt</span>
            </router-link>

            <hr style="border-color: rgba(255, 255, 255, 0.1); width: 85%; margin: 1.5rem auto;">

            <router-link 
                to="/" 
                class="nav-link text-info text-nowrap"
                target="_blank"
                :title="collapsed ? 'Xem trang Độc giả' : ''"
            >
                <i class="fas fa-external-link-alt fa-fw"></i>
                <span v-if="!collapsed">Xem trang Độc giả</span>
            </router-link>
        </nav>
    </aside>
</template>
