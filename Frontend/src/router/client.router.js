const clientRoutes = [
    {
        path: "/",
        component: () => import("@/components/client/ClientLayout.vue"),
        children: [
            {
                path: "",
                name: "client-home",
                component: () => import("@/views/client/Home.vue")
            },
            {
                path: "login",
                name: "client-login",
                component: () => import("@/views/client/Login.vue")
            },
            {
                path: "books",
                name: "client-books",
                component: () => import("@/views/client/books/BookList.vue")
            },
            {
                path: "books/:id",
                name: "client-book-detail",
                component: () => import("@/views/client/books/BookDetail.vue")
            },
            {
                path: "borrow-records",
                name: "client-borrow-records",
                component: () => import("@/views/client/borrow-records/BorrowRecordList.vue"),
                meta: { requiresReader: true }
            },
            {
                path: "/:pathMatch(.*)*",
                name: "notfound",
                component: () => import("@/views/client/NotFound.vue")
            }
        ]
    }
];

export default clientRoutes;
