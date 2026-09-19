<template>

    <div class="text-center mt-5">

        <h1 class="display-1">
            404
        </h1>

        <h3>
            Không tìm thấy trang
        </h3>

        <p class="text-muted">
            URL bạn truy cập không tồn tại.
        </p>

        <router-link
            :to="{ name: 'home' }"
            class="btn btn-primary"
        >
            <i class="fas fa-home"></i>
            Về trang chủ
        </router-link>

    </div>

</template>