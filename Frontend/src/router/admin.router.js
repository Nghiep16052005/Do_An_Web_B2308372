const adminRoutes = [
    {
        path: "/admin/login",
        name: "admin-login",
        component: () => import("@/views/admin/Login.vue"),
        meta: { requiresGuest: true }
    },
    {
        path: "/admin",
        component: () => import("@/components/admin/AdminLayout.vue"),
        meta: { requiresAdmin: true },
        children: [
            {
                path: "",
                redirect: { name: "admin-dashboard" }
            },
            {
                path: "dashboard",
                name: "admin-dashboard",
                component: () => import("@/views/admin/Dashboard.vue")
            },
            // Books
            {
                path: "books",
                name: "admin-books",
                component: () => import("@/views/admin/books/BookList.vue")
            },
            {
                path: "books/add",
                name: "admin-book-add",
                component: () => import("@/views/admin/books/BookAdd.vue")
            },
            {
                path: "books/edit/:id",
                name: "admin-book-edit",
                component: () => import("@/views/admin/books/BookEdit.vue")
            },
            {
                path: "books/:id",
                name: "admin-book-detail",
                component: () => import("@/views/admin/books/BookDetail.vue")
            },
            // Readers
            {
                path: "readers",
                name: "admin-readers",
                component: () => import("@/views/admin/readers/ReaderList.vue")
            },
            {
                path: "readers/add",
                name: "admin-reader-add",
                component: () => import("@/views/admin/readers/ReaderAdd.vue")
            },
            {
                path: "readers/edit/:id",
                name: "admin-reader-edit",
                component: () => import("@/views/admin/readers/ReaderEdit.vue")
            },
            {
                path: "readers/:id",
                name: "admin-reader-detail",
                component: () => import("@/views/admin/readers/ReaderDetail.vue")
            },
            // Publishers
            {
                path: "publishers",
                name: "admin-publishers",
                component: () => import("@/views/admin/publishers/PublisherList.vue")
            },
            {
                path: "publishers/add",
                name: "admin-publisher-add",
                component: () => import("@/views/admin/publishers/PublisherAdd.vue")
            },
            {
                path: "publishers/edit/:id",
                name: "admin-publisher-edit",
                component: () => import("@/views/admin/publishers/PublisherEdit.vue")
            },
            {
                path: "publishers/:id",
                name: "admin-publisher-detail",
                component: () => import("@/views/admin/publishers/PublisherDetail.vue")
            },
            // Borrow Records
            {
                path: "borrow-records",
                name: "admin-borrow-records",
                component: () => import("@/views/admin/borrow-records/BorrowRecordList.vue")
            },
            {
                path: "borrow-records/:id",
                name: "admin-borrow-record-detail",
                component: () => import("@/views/admin/borrow-records/BorrowRecordDetail.vue")
            }
        ]
    }
];

export default adminRoutes;
