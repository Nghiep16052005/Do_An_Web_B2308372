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
    }
};
</script>

<template>
    <div class="admin-wrapper">
        <AdminSidebar />
        <div class="admin-main">
            <AdminHeader />
            <main class="admin-content">
                <router-view />
            </main>
            <AdminFooter />
        </div>
    </div>
</template>
