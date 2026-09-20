<script>
export default {
    name: "NotFound"
};
</script>

<template>
    <div class="text-center py-5 my-5">
        <div class="avatar-circle mx-auto mb-4" style="width: 80px; height: 80px; background: #fee2e2; color: #ef4444; font-size: 2rem;">
            <i class="fas fa-exclamation"></i>
        </div>
        <h1 class="display-3 font-weight-bold text-dark mb-2">404</h1>
        <h3 class="font-weight-bold text-secondary mb-3">Không tìm thấy trang</h3>
        <p class="text-muted mb-4" style="max-width: 480px; margin: 0 auto;">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
        </p>
        <router-link to="/" class="btn btn-primary font-weight-semibold px-4 py-2">
            <i class="fas fa-home mr-1"></i> Về trang chủ
        </router-link>
    </div>
</template>