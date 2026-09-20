<script>
import ClientBookService from "@/services/client/book.service";

export default {
    name: "ClientBookList",

    data() {
        return {
            books: [],
            keyword: this.$route.query.q || "",
            onlyAvailable: false,
            loading: false,
            errorMessage: ""
        };
    },

    computed: {
        filteredBooks() {
            let list = this.books;
            if (this.onlyAvailable) {
                list = list.filter(b => b.quantity > 0);
            }
            return list;
        }
    },

    mounted() {
        if (this.keyword.trim()) {
            this.handleSearch();
        } else {
            this.fetchBooks();
        }
    },

    methods: {
        async fetchBooks() {
            this.loading = true;
            this.errorMessage = "";
            try {
                const response = await ClientBookService.getAllBooks();
                if (response.success) {
                    this.books = response.data || [];
                } else {
                    this.errorMessage = response.message || "Không thể tải danh sách sách.";
                }
            } catch (error) {
                console.error("Fetch books error:", error);
                this.errorMessage = "Không thể kết nối đến máy chủ thư viện.";
            } finally {
                this.loading = false;
            }
        },

        async handleSearch() {
            if (!this.keyword.trim()) {
                await this.fetchBooks();
                return;
            }

            this.loading = true;
            this.errorMessage = "";
            try {
                const response = await ClientBookService.searchBooks(this.keyword.trim());
                if (response.success) {
                    this.books = response.data || [];
                } else {
                    this.errorMessage = response.message || "Tìm kiếm sách thất bại.";
                }
            } catch (error) {
                console.error("Search books error:", error);
                this.errorMessage = "Không thể thực hiện tìm kiếm sách.";
            } finally {
                this.loading = false;
            }
        },

        async handleClear() {
            this.keyword = "";
            this.$router.replace({ query: {} });
            await this.fetchBooks();
        },

        formatCurrency(price) {
            return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price || 0);
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
        <!-- Page Title -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
            <div>
                <h3 class="font-weight-bold mb-1">
                    <i class="fas fa-book-open text-primary mr-2"></i> Tra cứu danh mục sách
                </h3>
                <p class="text-muted mb-0">Khám phá và mượn các đầu sách hiện có trong kho thư viện</p>
            </div>
        </div>

        <!-- Search & Filter Card -->
        <div class="card shadow-sm mb-4">
            <div class="card-body p-3">
                <form @submit.prevent="handleSearch">
                    <div class="row align-items-center">
                        <div class="col-md-7 mb-2 mb-md-0">
                            <div class="input-group">
                                <input 
                                    v-model="keyword" 
                                    type="text" 
                                    class="form-control" 
                                    placeholder="Tìm kiếm theo tên sách hoặc tác giả..." 
                                />
                                <div class="input-group-append">
                                    <button class="btn btn-primary" type="submit">
                                        <i class="fas fa-search mr-1"></i> Tìm
                                    </button>
                                    <button 
                                        v-if="keyword" 
                                        type="button" 
                                        class="btn btn-outline-secondary" 
                                        @click="handleClear"
                                    >
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-5 d-flex justify-content-md-end align-items-center">
                            <div class="custom-control custom-checkbox mr-3">
                                <input 
                                    type="checkbox" 
                                    class="custom-control-input" 
                                    id="filterAvailable" 
                                    v-model="onlyAvailable" 
                                />
                                <label class="custom-control-label small font-weight-semibold" for="filterAvailable">
                                    Chỉ hiện sách còn trong kho
                                </label>
                            </div>
                            <span class="text-muted small">
                                <strong>{{ filteredBooks.length }}</strong> kết quả
                            </span>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-triangle mr-1"></i> {{ errorMessage }}
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Đang tải sách...</p>
        </div>

        <div v-else-if="filteredBooks.length === 0" class="alert alert-warning text-center py-5">
            <i class="fas fa-search fa-2x mb-3 d-block text-warning"></i>
            <h5>Không tìm thấy sách nào phù hợp</h5>
            <p class="text-muted small mb-3">Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
            <button class="btn btn-outline-primary btn-sm" @click="handleClear">
                <i class="fas fa-redo mr-1"></i> Xem tất cả sách
            </button>
        </div>

        <!-- Book Cards Grid -->
        <div v-else class="row">
            <div v-for="book in filteredBooks" :key="book.bookId" class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 shadow-sm card-hover book-card">
                    <!-- Book Cover Image -->
                    <div class="book-cover-container position-relative">
                        <router-link :to="{ name: 'client-book-detail', params: { id: book.bookId } }" class="d-block text-center book-cover-link">
                            <img 
                                :src="getBookImage(book.image)" 
                                :alt="book.title" 
                                class="book-cover-img"
                                @error="handleImageError"
                                loading="lazy"
                            />
                        </router-link>
                        <span class="badge badge-light border book-id-badge">{{ book.bookId }}</span>
                        <span :class="['badge book-status-badge', book.quantity > 0 ? 'badge-success' : 'badge-danger']">
                            {{ book.quantity > 0 ? `Còn ${book.quantity} cuốn` : "Hết sách" }}
                        </span>
                    </div>

                    <div class="card-body d-flex flex-column pt-3">
                        <h5 class="card-title font-weight-bold mb-2 book-title">
                            <router-link 
                                :to="{ name: 'client-book-detail', params: { id: book.bookId } }" 
                                class="text-dark text-decoration-none book-title-link"
                                :title="book.title"
                            >
                                {{ book.title }}
                            </router-link>
                        </h5>

                        <p class="text-muted small mb-1">
                            <i class="fas fa-user-edit mr-1 text-primary"></i> <strong>Tác giả:</strong> {{ book.author }}
                        </p>

                        <p class="text-muted small mb-1">
                            <i class="fas fa-building mr-1 text-warning"></i> <strong>Nhà XB:</strong> {{ book.publisherId }}
                        </p>

                        <p class="text-muted small mb-3">
                            <i class="fas fa-calendar-alt mr-1 text-info"></i> <strong>Năm XB:</strong> {{ book.publicationYear }}
                        </p>

                        <div class="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                            <div>
                                <span class="text-muted small d-block" style="font-size: 0.75rem;">Đơn giá</span>
                                <span class="font-weight-bold text-primary h5 mb-0">
                                    {{ formatCurrency(book.price) }}
                                </span>
                            </div>

                            <router-link 
                                :to="{ name: 'client-book-detail', params: { id: book.bookId } }" 
                                class="btn btn-outline-primary btn-sm px-3"
                            >
                                <i class="fas fa-eye mr-1"></i> Chi tiết
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.book-card {
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    border: 1px solid #e2e8f0;
}

.book-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.1) !important;
}

.book-cover-container {
    height: 230px;
    background: linear-gradient(145deg, #f8fafc 0%, #edf2f7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    overflow: hidden;
    border-bottom: 1px solid #e2e8f0;
}

.book-cover-link {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.book-cover-img {
    max-height: 195px;
    max-width: 100%;
    object-fit: contain;
    border-radius: 6px;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.book-card:hover .book-cover-img {
    transform: scale(1.05);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.22);
}

.book-id-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    font-size: 0.75rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
}

.book-status-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 0.75rem;
    box-shadow: 0 2px 5px rgba(0,0,0,0.15);
}

.book-title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
    min-height: 2.8rem;
    font-size: 1.05rem;
}

.book-title-link:hover {
    color: var(--primary-color) !important;
    text-decoration: underline !important;
}
</style>
