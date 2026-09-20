import { createRouter, createWebHistory } from "vue-router";
import adminRoutes from "./admin.router";
import clientRoutes from "./client.router";
import AdminAuthService from "@/services/admin/auth.service";
import ClientAuthService from "@/services/client/auth.service";

const routes = [
    ...adminRoutes,
    ...clientRoutes
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior() {
        return { top: 0 };
    }
});

router.beforeEach((to, from, next) => {
    // Check Admin authorization
    if (to.matched.some(record => record.meta.requiresAdmin)) {
        if (!AdminAuthService.isLoggedIn()) {
            return next({ name: "admin-login", query: { redirect: to.fullPath } });
        }
    }

    // Check Reader authorization
    if (to.matched.some(record => record.meta.requiresReader)) {
        if (!ClientAuthService.isLoggedIn()) {
            return next({ name: "client-login", query: { redirect: to.fullPath } });
        }
    }

    next();
});

export default router;