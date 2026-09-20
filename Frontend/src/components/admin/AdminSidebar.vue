<script>
export default {
    name: "AdminSidebar"
};
</script>

<template>
    <aside class="admin-sidebar">
        <div class="sidebar-brand">
            <i class="fas fa-book-reader text-primary"></i>
            <span>ADMIN PORTAL</span>
        </div>

        <nav class="nav flex-column mt-3">
            <router-link 
                :to="{ name: 'admin-dashboard' }" 
                class="nav-link"
                active-class="active"
            >
                <i class="fas fa-chart-line fa-fw"></i>
                <span>Bảng điều khiển</span>
            </router-link>

            <router-link 
                :to="{ name: 'admin-books' }" 
                class="nav-link"
                active-class="active"
            >
                <i class="fas fa-book fa-fw"></i>
                <span>Quản lý Sách</span>
            </router-link>

            <router-link 
                :to="{ name: 'admin-readers' }" 
                class="nav-link"
                active-class="active"
            >
                <i class="fas fa-users fa-fw"></i>
                <span>Quản lý Độc giả</span>
            </router-link>

            <router-link 
                :to="{ name: 'admin-publishers' }" 
                class="nav-link"
                active-class="active"
            >
                <i class="fas fa-building fa-fw"></i>
                <span>Nhà xuất bản</span>
            </router-link>

            <router-link 
                :to="{ name: 'admin-borrow-records' }" 
                class="nav-link"
                active-class="active"
            >
                <i class="fas fa-clipboard-list fa-fw"></i>
                <span>Mượn trả sách</span>
            </router-link>

            <hr style="border-color: rgba(255, 255, 255, 0.1); width: 85%; margin: 1.5rem auto;">

            <router-link 
                to="/" 
                class="nav-link text-info"
                target="_blank"
            >
                <i class="fas fa-external-link-alt fa-fw"></i>
                <span>Xem trang Độc giả</span>
            </router-link>
        </nav>
    </aside>
</template>
