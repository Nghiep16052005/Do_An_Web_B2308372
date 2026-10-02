<script>
import ClientBookService from "@/services/client/book.service";
import ClientAuthService from "@/services/client/auth.service";

export default {
    name: "ClientHome",

    data() {
        return {
            keyword: "",
            featuredBooks: [],
            loading: false,
            reader: null
        };
    },

    mounted() {
        this.reader = ClientAuthService.getCurrentReader();
        this.fetchFeaturedBooks();
        window.addEventListener("book-quantity-updated", this.handleRealtimeBookUpdate);
    },

    beforeUnmount() {
        window.removeEventListener("book-quantity-updated", this.handleRealtimeBookUpdate);
    },

    methods: {
        handleRealtimeBookUpdate(event) {
            const data = event.detail;
            if (data && this.featuredBooks) {
                const book = this.featuredBooks.find(b => b.bookId === data.bookId);
                if (book) {
                    book.quantity = data.quantity;
                }
            }
        },

        async fetchFeaturedBooks() {
            this.loading = true;
            try {
                const response = await ClientBookService.getAllBooks();
                if (response.success && response.data) {
                    this.featuredBooks = response.data.slice(0, 6);
                }
            } catch (error) {
                console.error("Fetch featured books error:", error);
            } finally {
                this.loading = false;
            }
        },

        handleSearch() {
            if (this.keyword.trim()) {
                this.$router.push({
                    name: "client-books",
                    query: { q: this.keyword.trim() }
                });
            } else {
                this.$router.push({ name: "client-books" });
            }
        },

        formatCurrency(price) {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }).format(price || 0);
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
        <!-- Hero Section -->
        <div class="jumbotron p-4 p-md-5 text-white rounded shadow-sm mb-5" style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);">
            <div class="col-md-9 px-0">
                <span class="badge badge-warning text-dark font-weight-bold mb-3 px-3 py-2">
                    <i class="fas fa-sparkles mr-1"></i> Khám phá tri thức
                </span>
                <h1 class="display-4 font-weight-bold">Thư Viện Trực Tuyến</h1>
                <p class="lead my-3 text-light">
                    Hàng ngàn đầu sách phong phú thuộc mọi lĩnh vực đang chờ đón bạn. Dễ dàng tra cứu thông tin, đăng ký mượn và theo dõi hạn trả sách trực tuyến.
                </p>

                <!-- Quick Search -->
                <form @submit.prevent="handleSearch" class="mt-4" style="max-width: 600px;">
                    <div class="input-group input-group-lg">
                        <input 
                            v-model="keyword" 
                            type="text" 
                            class="form-control border-0" 
                            placeholder="Nhập tên sách hoặc tác giả muốn tìm..." 
                        />
                        <div class="input-group-append">
                            <button class="btn btn-warning text-dark font-weight-bold px-4" type="submit">
                                <i class="fas fa-search mr-1"></i> Tìm sách
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- Features Banner -->
        <div class="row mb-5 text-center">
            <div class="col-md-4 mb-4 mb-md-0">
                <div class="card h-100 border-0 shadow-sm p-3 card-hover">
                    <div class="card-body">
                        <div class="avatar-circle mx-auto mb-3" style="width: 60px; height: 60px; font-size: 1.5rem;">
                            <i class="fas fa-book-reader"></i>
                        </div>
                        <h5 class="font-weight-bold">Kho sách phong phú</h5>
                        <p class="text-muted small mb-0">Cung cấp tài liệu, giáo trình, tiểu thuyết từ các nhà xuất bản uy tín hàng đầu.</p>
                    </div>
                </div>
            </div>

            <div class="col-md-4 mb-4 mb-md-0">
                <div class="card h-100 border-0 shadow-sm p-3 card-hover">
                    <div class="card-body">
                        <div class="avatar-circle mx-auto mb-3" style="width: 60px; height: 60px; background: #dcfce7; color: #10b981; font-size: 1.5rem;">
                            <i class="fas fa-clock"></i>
                        </div>
                        <h5 class="font-weight-bold">Mượn sách nhanh chóng</h5>
                        <p class="text-muted small mb-0">Thao tác mượn sách trực tuyến chỉ trong vài giây ngay sau khi đăng nhập bằng mã độc giả.</p>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card h-100 border-0 shadow-sm p-3 card-hover">
                    <div class="card-body">
                        <div class="avatar-circle mx-auto mb-3" style="width: 60px; height: 60px; background: #fef3c7; color: #f59e0b; font-size: 1.5rem;">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <h5 class="font-weight-bold">Theo dõi hạn trả</h5>
                        <p class="text-muted small mb-0">Quản lý các cuốn sách đang mượn, xem chi tiết ngày hết hạn và chủ động trả sách online.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Featured Books Section -->
        <div class="mb-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="font-weight-bold mb-0">
                        <i class="fas fa-fire text-danger mr-2"></i> Sách mới & Nổi bật
                    </h3>
                    <p class="text-muted small mb-0">Những đầu sách được quan tâm nhất tại thư viện</p>
                </div>
                <router-link :to="{ name: 'client-books' }" class="btn btn-outline-primary btn-sm font-weight-semibold">
                    Xem tất cả sách <i class="fas fa-arrow-right ml-1"></i>
                </router-link>
            </div>

            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2 text-muted">Đang tải sách nổi bật...</p>
            </div>

            <div v-else-if="featuredBooks.length === 0" class="alert alert-info text-center py-4">
                Hiện tại chưa có dữ liệu sách nổi bật.
            </div>

            <div v-else class="row">
                <div v-for="b in featuredBooks" :key="b.bookId" class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm card-hover book-card">
                        <!-- Book Cover Image -->
                        <div class="book-cover-container position-relative">
                            <router-link :to="{ name: 'client-book-detail', params: { id: b.bookId } }" class="d-block text-center book-cover-link">
                                <img 
                                    :src="getBookImage(b.image)" 
                                    :alt="b.title" 
                                    class="book-cover-img"
                                    @error="handleImageError"
                                    loading="lazy"
                                />
                            </router-link>
                            <span class="badge badge-light border book-id-badge">{{ b.bookId }}</span>
                            <span :class="['badge book-status-badge', b.quantity > 0 ? 'badge-success' : 'badge-danger']">
                                {{ b.quantity > 0 ? `Còn ${b.quantity} cuốn` : "Hết sách" }}
                            </span>
                        </div>

                        <div class="card-body d-flex flex-column pt-3">
                            <h5 class="card-title font-weight-bold mb-2 book-title">
                                <router-link 
                                    :to="{ name: 'client-book-detail', params: { id: b.bookId } }" 
                                    class="text-dark text-decoration-none book-title-link"
                                    :title="b.title"
                                >
                                    {{ b.title }}
                                </router-link>
                            </h5>

                            <p class="text-muted small mb-1">
                                <i class="fas fa-user-edit mr-1 text-primary"></i> <strong>Tác giả:</strong> {{ b.author }}
                            </p>

                            <p class="text-muted small mb-3">
                                <i class="fas fa-building mr-1 text-secondary"></i> NXB: {{ b.publisherId }} - Năm {{ b.publicationYear }}
                            </p>

                            <div class="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                                <div>
                                    <span class="text-muted small d-block" style="font-size: 0.75rem;">Đơn giá</span>
                                    <span class="font-weight-bold text-primary h5 mb-0">
                                        {{ formatCurrency(b.price) }}
                                    </span>
                                </div>

                                <router-link 
                                    :to="{ name: 'client-book-detail', params: { id: b.bookId } }" 
                                    class="btn btn-outline-primary btn-sm px-3"
                                >
                                    <i class="fas fa-book-reader mr-1"></i> Chi tiết
                                </router-link>
                            </div>
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
