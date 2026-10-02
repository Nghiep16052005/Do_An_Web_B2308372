<script>
import AdminBookService from "@/services/admin/book.service";

export default {
    name: "AdminBookList",

    data() {
        return {
            books: [],
            keyword: "",
            loading: false,
            errorMessage: "",
            successMessage: ""
        };
    },

    computed: {
        filteredBooks() {
            if (!this.keyword.trim()) return this.books;
            const kw = this.keyword.toLowerCase().trim();
            return this.books.filter(b => 
                (b.bookId && b.bookId.toLowerCase().includes(kw)) ||
                (b.title && b.title.toLowerCase().includes(kw)) ||
                (b.author && b.author.toLowerCase().includes(kw))
            );
        }
    },

    mounted() {
        this.fetchBooks();
    },

    methods: {
        async fetchBooks() {
            this.loading = true;
            this.errorMessage = "";
            try {
                const response = await AdminBookService.getAllBooks();
                if (response.success) {
                    this.books = response.data || [];
                } else {
                    this.errorMessage = response.message || "Không thể tải danh sách sách.";
                }
            } catch (error) {
                console.error("Fetch books error:", error);
                this.errorMessage = "Không thể kết nối đến máy chủ.";
            } finally {
                this.loading = false;
            }
        },

        async handleDelete(bookId) {
            if (!confirm(`Bạn có chắc chắn muốn xóa sách có mã "${bookId}" không?`)) {
                return;
            }

            try {
                const response = await AdminBookService.deleteBook(bookId);
                if (response.success) {
                    this.successMessage = "Xóa sách thành công!";
                    await this.fetchBooks();
                    setTimeout(() => { this.successMessage = ""; }, 3000);
                } else {
                    this.errorMessage = response.message || "Xóa sách thất bại.";
                }
            } catch (error) {
                console.error("Delete book error:", error);
                this.errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi xóa sách.";
            }
        },

        formatCurrency(value) {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }).format(value || 0);
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
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
            <div>
                <h3 class="font-weight-bold mb-1">Quản lý Sách</h3>
                <p class="text-muted mb-0">Quản lý danh mục sách và số lượng tồn trong kho thư viện</p>
            </div>
            <div class="mt-3 mt-md-0">
                <router-link :to="{ name: 'admin-book-add' }" class="btn btn-primary">
                    <i class="fas fa-plus mr-1"></i> Thêm sách mới
                </router-link>
            </div>
        </div>

        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
            <i class="fas fa-check-circle mr-1"></i> {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show">
            <i class="fas fa-exclamation-triangle mr-1"></i> {{ errorMessage }}
        </div>

        <!-- Filter Card -->
        <div class="card shadow-sm mb-4">
            <div class="card-body py-3">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
                            </div>
                            <input 
                                v-model="keyword" 
                                type="text" 
                                class="form-control" 
                                placeholder="Tìm kiếm theo mã sách, tên sách, tác giả..." 
                            />
                            <div v-if="keyword" class="input-group-append">
                                <button class="btn btn-outline-secondary" @click="keyword = ''">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 text-md-right text-muted mt-2 mt-md-0 small">
                        Hiển thị <strong>{{ filteredBooks.length }}</strong> / {{ books.length }} tựa sách
                    </div>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="card shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Ảnh</th>
                            <th>Mã sách</th>
                            <th>Tên sách</th>
                            <th>Tác giả</th>
                            <th>Mã NXB</th>
                            <th>Năm XB</th>
                            <th>Đơn giá</th>
                            <th>Số lượng</th>
                            <th class="text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="9" class="text-center py-5">
                                <div class="spinner-border text-primary spinner-border-sm mr-2"></div>
                                Đang tải danh sách sách...
                            </td>
                        </tr>
                        <tr v-else-if="filteredBooks.length === 0">
                            <td colspan="9" class="text-center py-5 text-muted">
                                <i class="fas fa-folder-open fa-2x mb-2 d-block text-muted"></i>
                                Không tìm thấy cuốn sách nào phù hợp.
                            </td>
                        </tr>
                        <tr v-else v-for="b in filteredBooks" :key="b.bookId">
                            <td style="width: 50px;">
                                <img 
                                    :src="getBookImage(b.image)" 
                                    :alt="b.title" 
                                    class="rounded shadow-sm"
                                    style="width: 42px; height: 56px; object-fit: cover; background: #f1f5f9;"
                                    @error="handleImageError"
                                    loading="lazy"
                                />
                            </td>
                            <td class="font-weight-bold text-primary">{{ b.bookId }}</td>
                            <td class="font-weight-semibold">{{ b.title }}</td>
                            <td>{{ b.author }}</td>
                            <td><span class="badge badge-light border">{{ b.publisherId }}</span></td>
                            <td>{{ b.publicationYear }}</td>
                            <td>{{ formatCurrency(b.price) }}</td>
                            <td>
                                <span :class="['badge', b.quantity > 0 ? 'badge-success' : 'badge-danger']">
                                    {{ b.quantity }}
                                </span>
                            </td>
                            <td class="text-center text-nowrap">
                                <router-link 
                                    :to="{ name: 'admin-book-detail', params: { id: b.bookId } }" 
                                    class="btn btn-outline-info btn-sm mr-1"
                                    title="Xem chi tiết"
                                >
                                    <i class="fas fa-eye"></i>
                                </router-link>
                                <router-link 
                                    :to="{ name: 'admin-book-edit', params: { id: b.bookId } }" 
                                    class="btn btn-outline-warning btn-sm mr-1"
                                    title="Chỉnh sửa"
                                >
                                    <i class="fas fa-edit"></i>
                                </router-link>
                                <button 
                                    class="btn btn-outline-danger btn-sm"
                                    title="Xóa sách"
                                    @click="handleDelete(b.bookId)"
                                >
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
