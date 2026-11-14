<script>
import AdminHeader from "./AdminHeader.vue";
import AdminSidebar from "./AdminSidebar.vue";
import AdminFooter from "./AdminFooter.vue";

export default {
    name: "AdminLayout",

    components: {
        AdminHeader,
        AdminSidebar,
        AdminFooter
    },

    data() {
        return {
            isSidebarCollapsed: false
        };
    },

    methods: {
        toggleSidebar() {
            this.isSidebarCollapsed = !this.isSidebarCollapsed;
        }
    }
};
</script>

<template>
    <div class="admin-wrapper">
        <AdminSidebar :collapsed="isSidebarCollapsed" />
        <div class="admin-main">
            <AdminHeader :collapsed="isSidebarCollapsed" @toggle-sidebar="toggleSidebar" />
            <main class="admin-content">
                <router-view />
            </main>
            <AdminFooter />
        </div>
    </div>
</template>
