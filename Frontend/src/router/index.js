import {
    createRouter,
    createWebHistory
} from "vue-router";

import Home from "@/views/Home.vue";

const routes = [

    {
        path: "/",
        name: "home",
        component: Home
    },

    {
        path: "/books",
        name: "books",
        component: () =>
            import("@/views/BookListView.vue")
    },

    {
        path: "/books/add",
        name: "book-add",
        component: () =>
            import("@/views/BookAdd.vue")
    },

    {
        path: "/books/edit/:id",
        name: "book-edit",
        component: () =>
            import("@/views/BookEdit.vue")
    },

    {
        path: "/borrow-records",
        name: "borrow-records",
        component: () =>
            import("@/views/BorrowRecords.vue")
    },

    {
        path: "/:pathMatch(.*)*",
        name: "notfound",
        component: () =>
            import("@/views/NotFound.vue")
    }

];

const router = createRouter({

    history: createWebHistory(
        import.meta.env.BASE_URL
    ),

    routes

});

export default router;