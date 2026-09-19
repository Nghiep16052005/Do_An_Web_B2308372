<template>

    <div class="text-center mt-5">

        <i
            class="fas fa-book-reader fa-4x mb-4"
        ></i>

        <h1>
            Library Management System
        </h1>

        <p class="lead">
            Hệ thống quản lý thư viện
        </p>

        <p class="text-muted">
            Quản lý sách, độc giả và quá trình mượn trả sách.
        </p>

        <div class="mt-4">

            <router-link
                :to="{ name: 'books' }"
                class="btn btn-primary mr-2"
            >
                <i class="fas fa-book"></i>
                Xem sách
            </router-link>

            <router-link
                :to="{ name: 'borrow-records' }"
                class="btn btn-success"
            >
                <i class="fas fa-history"></i>
                Lịch sử mượn
            </router-link>

        </div>

    </div>

</template>