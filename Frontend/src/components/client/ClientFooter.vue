<script>
export default {
    name: "ClientFooter"
};
</script>

<template>
    <footer class="client-footer">
        <div class="container">
            <div class="row">
                <div class="col-md-4 mb-4 mb-md-0">
                    <h5 class="text-white mb-3">
                        <i class="fas fa-book-reader text-primary mr-2"></i>
                        Thư Viện Sách Trực Tuyến
                    </h5>
                    <p class="text-muted small">
                        Hệ thống mượn trả và tra cứu thông tin sách nhanh chóng, thuận tiện dành cho độc giả và bạn đọc.
                    </p>
                </div>

                <div class="col-md-4 mb-4 mb-md-0">
                    <h6 class="text-white mb-3">Liên kết nhanh</h6>
                    <ul class="list-unstyled small">
                        <li class="mb-2">
                            <router-link to="/">Trang chủ</router-link>
                        </li>
                        <li class="mb-2">
                            <router-link to="/books">Danh mục sách</router-link>
                        </li>
                        <li class="mb-2">
                            <router-link to="/borrow-records">Phiếu mượn của bạn</router-link>
                        </li>
                    </ul>
                </div>

                <div class="col-md-4">
                    <h6 class="text-white mb-3">Thông tin liên hệ</h6>
                    <p class="text-muted small mb-1">
                        <i class="fas fa-map-marker-alt mr-2 text-primary"></i> Khoa CNTT & TT, Đại học Cần Thơ
                    </p>
                    <p class="text-muted small mb-1">
                        <i class="fas fa-phone mr-2 text-primary"></i> 0123 456 789
                    </p>
                    <p class="text-muted small">
                        <i class="fas fa-envelope mr-2 text-primary"></i> library@ctu.edu.vn
                    </p>
                </div>
            </div>

            <hr style="border-color: rgba(255, 255, 255, 0.1);" class="my-3">

            <div class="text-center text-muted small">
                &copy; {{ new Date().getFullYear() }} Thư Viện Đại Học. Tất cả các quyền được bảo lưu.
            </div>
        </div>
    </footer>
</template>
