<template>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">

        <div class="container">

            <router-link
                :to="{ name: 'home' }"
                class="navbar-brand"
            >
                <i class="fas fa-book"></i>
                Library Management
            </router-link>

            <div class="navbar-nav">

                <router-link
                    :to="{ name: 'home' }"
                    class="nav-link"
                >
                    <i class="fas fa-home"></i>
                    Trang chủ
                </router-link>

                <router-link
                    :to="{ name: 'books' }"
                    class="nav-link"
                >
                    <i class="fas fa-book-open"></i>
                    Sách
                </router-link>

                <router-link
                    :to="{ name: 'borrow-records' }"
                    class="nav-link"
                >
                    <i class="fas fa-book-reader"></i>
                    Mượn sách
                </router-link>

            </div>

        </div>

    </nav>
</template>