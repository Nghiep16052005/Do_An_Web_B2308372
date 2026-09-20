<script>
import AdminBookService from "@/services/admin/book.service";

export default {
    name: "AdminBookDetail",

    data() {
        return {
            bookId: this.$route.params.id,
            book: null,
            loading: false,
            errorMessage: ""
        };
    },

    mounted() {
        this.fetchBook();
    },

    methods: {
        async fetchBook() {
            this.loading = true;
            try {
                const response = await AdminBookService.getBookById(this.bookId);
                if (response.success && response.data) {
                    this.book = response.data;
                } else {
                    this.errorMessage = response.message || "Không tìm thấy thông tin sách.";
                }
            } catch (error) {
                console.error("Get book detail error:", error);
                this.errorMessage = "Không thể tải chi tiết cuốn sách.";
            } finally {
                this.loading = false;
            }
        },

        async handleDelete() {
            if (!confirm(`Bạn có chắc chắn muốn xóa sách "${this.book.title}" không?`)) {
                return;
            }

            try {
                const response = await AdminBookService.deleteBook(this.bookId);
                if (response.success) {
                    this.$router.push({ name: "admin-books" });
                } else {
                    alert(response.message || "Xóa sách thất bại.");
                }
            } catch (error) {
                console.error("Delete book error:", error);
                alert("Đã xảy ra lỗi khi xóa sách.");
            }
        },

        formatCurrency(value) {
            return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
        },

        formatDate(dateStr) {
            if (!dateStr) return "-";
            return new Date(dateStr).toLocaleString("vi-VN");
        },

        getBookImage(image) {
            if (!image) return "/images/default-book.svg";
            if (image.startsWith("http://") || image.startsWith("https://")) return image;
            if (image.startsWith("/")) return image;
            return `/images/${image}`;
        },

        handleImageError(event) {
            event.target.src = "/images/default-book.svg";
        }
    }
};
</script>

<template>
    <div>
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div class="d-flex align-items-center">
                <router-link :to="{ name: 'admin-books' }" class="btn btn-outline-secondary btn-sm mr-3">
                    <i class="fas fa-arrow-left mr-1"></i> Quay lại
                </router-link>
                <div>
                    <h3 class="font-weight-bold mb-0">Chi tiết đầu sách</h3>
                    <p class="text-muted small mb-0">Mã sách: {{ bookId }}</p>
                </div>
            </div>

            <div v-if="book" class="d-flex">
                <router-link 
                    :to="{ name: 'admin-book-edit', params: { id: bookId } }" 
                    class="btn btn-warning btn-sm mr-2"
                >
                    <i class="fas fa-edit mr-1"></i> Chỉnh sửa
                </router-link>
                <button class="btn btn-danger btn-sm" @click="handleDelete">
                    <i class="fas fa-trash-alt mr-1"></i> Xóa
                </button>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Đang tải thông tin sách...</p>
        </div>

        <div v-else-if="book" class="card shadow-sm" style="max-width: 850px;">
            <div class="card-header bg-white">
                <h5 class="mb-0 text-primary font-weight-bold">
                    <i class="fas fa-book mr-2"></i> {{ book.title }}
                </h5>
            </div>
            <div class="card-body p-4">
                <div class="row">
                    <div class="col-md-4 text-center mb-3 mb-md-0">
                        <div class="p-3 bg-light rounded shadow-sm d-flex align-items-center justify-content-center" style="min-height: 220px;">
                            <img 
                                :src="getBookImage(book.image)" 
                                :alt="book.title" 
                                class="img-fluid rounded shadow-sm"
                                style="max-height: 200px; object-fit: contain;"
                                @error="handleImageError"
                            />
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <span class="text-muted d-block small">Mã sách</span>
                                <strong class="h6">{{ book.bookId }}</strong>
                            </div>
                            <div class="col-md-6 mb-3">
                                <span class="text-muted d-block small">Tác giả</span>
                                <strong class="h6">{{ book.author }}</strong>
                            </div>
                            <div class="col-md-6 mb-3">
                                <span class="text-muted d-block small">Mã Nhà xuất bản</span>
                                <span class="badge badge-light border">{{ book.publisherId }}</span>
                            </div>
                            <div class="col-md-6 mb-3">
                                <span class="text-muted d-block small">Năm xuất bản</span>
                                <span>{{ book.publicationYear }}</span>
                            </div>
                            <div class="col-md-6 mb-3">
                                <span class="text-muted d-block small">Đơn giá</span>
                                <strong class="text-success font-weight-bold">{{ formatCurrency(book.price) }}</strong>
                            </div>
                            <div class="col-md-6 mb-3">
                                <span class="text-muted d-block small">Số lượng tồn kho</span>
                                <span :class="['badge', book.quantity > 0 ? 'badge-success' : 'badge-danger']">
                                    {{ book.quantity }} cuốn
                                </span>
                            </div>
                            <div class="col-md-6 mb-3">
                                <span class="text-muted d-block small">Ngày tạo</span>
                                <span class="small">{{ formatDate(book.createdAt) }}</span>
                            </div>
                            <div class="col-md-6 mb-3">
                                <span class="text-muted d-block small">Cập nhật lần cuối</span>
                                <span class="small">{{ formatDate(book.updatedAt) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
