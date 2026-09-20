<script>
import ClientBookService from "@/services/client/book.service";
import ClientAuthService from "@/services/client/auth.service";
import ClientBorrowRecordService from "@/services/client/borrowRecord.service";

export default {
    name: "ClientBookDetail",

    data() {
        const defaultDue = new Date();
        defaultDue.setDate(defaultDue.getDate() + 14);

        return {
            bookId: this.$route.params.id,
            book: null,
            reader: null,
            loading: false,
            borrowing: false,
            dueDate: defaultDue.toISOString().split("T")[0],
            errorMessage: "",
            successMessage: "",
            showBorrowModal: false
        };
    },

    mounted() {
        this.reader = ClientAuthService.getCurrentReader();
        this.fetchBook();
    },

    methods: {
        async fetchBook() {
            this.loading = true;
            this.errorMessage = "";
            try {
                const response = await ClientBookService.getBookById(this.bookId);
                if (response.success && response.data) {
                    this.book = response.data;
                } else {
                    this.errorMessage = response.message || "Không tìm thấy thông tin sách.";
                }
            } catch (error) {
                console.error("Get book detail error:", error);
                this.errorMessage = "Không thể kết nối để lấy thông tin sách.";
            } finally {
                this.loading = false;
            }
        },

        openBorrowDialog() {
            if (!this.reader) {
                this.$router.push({
                    name: "client-login",
                    query: { redirect: this.$route.fullPath }
                });
                return;
            }
            this.showBorrowModal = true;
            this.errorMessage = "";
            this.successMessage = "";
        },

        async handleBorrowBook() {
            if (!this.dueDate) {
                alert("Vui lòng chọn ngày dự kiến trả sách.");
                return;
            }

            this.borrowing = true;
            this.errorMessage = "";

            try {
                const response = await ClientBorrowRecordService.borrowBook({
                    bookId: this.bookId,
                    dueDate: this.dueDate
                });

                if (response.success) {
                    this.successMessage = "Đăng ký mượn sách thành công!";
                    this.showBorrowModal = false;
                    await this.fetchBook(); // Refresh quantity
                } else {
                    this.errorMessage = response.message || "Mượn sách thất bại.";
                }
            } catch (error) {
                console.error("Borrow book error:", error);
                this.errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi mượn sách.";
            } finally {
                this.borrowing = false;
            }
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
        <div class="mb-4">
            <router-link :to="{ name: 'client-books' }" class="btn btn-outline-secondary btn-sm">
                <i class="fas fa-arrow-left mr-1"></i> Quay lại danh sách sách
            </router-link>
        </div>

        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
            <i class="fas fa-check-circle mr-1"></i> {{ successMessage }}
            <router-link :to="{ name: 'client-borrow-records' }" class="ml-2 font-weight-bold text-success text-underline">
                Xem phiếu mượn &rarr;
            </router-link>
        </div>

        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show">
            <i class="fas fa-exclamation-triangle mr-1"></i> {{ errorMessage }}
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Đang tải thông tin sách...</p>
        </div>

        <div v-else-if="book" class="row">
            <div class="col-lg-8">
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-white py-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge badge-primary px-3 py-2">Mã sách: {{ book.bookId }}</span>
                            <span :class="['badge', book.quantity > 0 ? 'badge-success' : 'badge-danger', 'px-3 py-2']">
                                {{ book.quantity > 0 ? `Còn lại ${book.quantity} cuốn` : "Đã hết sách" }}
                            </span>
                        </div>
                    </div>
                    <div class="card-body p-4">
                        <div class="row mb-4">
                            <div class="col-md-4 text-center mb-4 mb-md-0">
                                <div class="book-detail-cover-box p-3 bg-light rounded shadow-sm d-flex align-items-center justify-content-center" style="min-height: 260px; background: linear-gradient(145deg, #f8fafc 0%, #edf2f7 100%);">
                                    <img 
                                        :src="getBookImage(book.image)" 
                                        :alt="book.title" 
                                        class="img-fluid rounded shadow"
                                        style="max-height: 250px; object-fit: contain;"
                                        @error="handleImageError"
                                    />
                                </div>
                            </div>
                            <div class="col-md-8">
                                <h2 class="font-weight-bold text-dark mb-3">{{ book.title }}</h2>

                                <div class="mb-3">
                                    <span class="text-muted small d-block">Tác giả</span>
                                    <strong class="h5 text-dark">{{ book.author }}</strong>
                                </div>
                                <div class="mb-3">
                                    <span class="text-muted small d-block">Nhà xuất bản</span>
                                    <strong class="h5 text-dark">{{ book.publisherId }}</strong>
                                </div>
                                <div class="mb-3">
                                    <span class="text-muted small d-block">Năm xuất bản</span>
                                    <span class="h6">{{ book.publicationYear }}</span>
                                </div>
                                <div class="mb-3">
                                    <span class="text-muted small d-block">Giá bìa tham chiếu</span>
                                    <span class="h4 text-primary font-weight-bold">{{ formatCurrency(book.price) }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="alert alert-light border">
                            <h6 class="font-weight-bold mb-2 text-dark">
                                <i class="fas fa-info-circle text-primary mr-1"></i> Quy định mượn sách
                            </h6>
                            <ul class="mb-0 small text-muted pl-3">
                                <li>Mỗi độc giả được mượn tối đa 1 cuốn cùng mã tại cùng một thời điểm.</li>
                                <li>Thời hạn mượn thông thường tối đa 14 - 30 ngày kể từ ngày đăng ký mượn.</li>
                                <li>Vui lòng bảo quản sách cẩn thận và trả sách đúng hạn tại quầy thủ thư hoặc trực tuyến.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Card -->
            <div class="col-lg-4">
                <div class="card shadow-sm border-primary">
                    <div class="card-header bg-primary text-white font-weight-bold">
                        <i class="fas fa-bookmark mr-1"></i> Đăng ký mượn sách
                    </div>
                    <div class="card-body p-4">
                        <div class="text-center mb-4">
                            <div class="mb-3 d-flex justify-content-center">
                                <img 
                                    :src="getBookImage(book.image)" 
                                    :alt="book.title" 
                                    class="rounded shadow-sm"
                                    style="height: 100px; width: 75px; object-fit: cover;"
                                    @error="handleImageError"
                                />
                            </div>
                            <h5 class="font-weight-bold text-dark">{{ book.title }}</h5>
                            <span :class="['badge', book.quantity > 0 ? 'badge-success' : 'badge-danger']">
                                {{ book.quantity > 0 ? 'Sẵn sàng cho mượn' : 'Tạm hết' }}
                            </span>
                        </div>

                        <div v-if="reader" class="mb-3 p-2 bg-light rounded small">
                            <i class="fas fa-user-check text-success mr-1"></i>
                            Độc giả: <strong>{{ reader.fullName }}</strong> ({{ reader.readerId }})
                        </div>
                        <div v-else class="mb-3 p-2 bg-light rounded small text-muted">
                            <i class="fas fa-info-circle text-info mr-1"></i>
                            Bạn cần đăng nhập để thực hiện mượn sách.
                        </div>

                        <button 
                            class="btn btn-primary btn-block btn-lg font-weight-bold" 
                            :disabled="book.quantity <= 0"
                            @click="openBorrowDialog"
                        >
                            <i class="fas fa-hand-holding mr-1"></i>
                            {{ book.quantity > 0 ? 'Mượn cuốn sách này' : 'Tạm hết sách' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Borrow Modal / Dialog -->
        <div v-if="showBorrowModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 12px;">
                    <div class="modal-header border-bottom-0 pb-0">
                        <h5 class="modal-title font-weight-bold">Xác nhận mượn sách</h5>
                        <button type="button" class="close" @click="showBorrowModal = false">&times;</button>
                    </div>
                    <div class="modal-body py-4">
                        <p class="mb-3">Bạn đang đăng ký mượn tựa sách:</p>
                        <div class="p-3 bg-light rounded mb-3">
                            <div class="font-weight-bold text-primary">{{ book.title }}</div>
                            <div class="small text-muted">Mã sách: {{ book.bookId }} | Tác giả: {{ book.author }}</div>
                        </div>

                        <div class="form-group mb-0">
                            <label class="font-weight-semibold">Hạn dự kiến trả sách <span class="text-danger">*</span></label>
                            <input 
                                v-model="dueDate" 
                                type="date" 
                                class="form-control" 
                                required 
                            />
                            <small class="text-muted">Chọn ngày bạn dự kiến mang trả sách cho thư viện.</small>
                        </div>
                    </div>
                    <div class="modal-footer border-top-0 pt-0">
                        <button type="button" class="btn btn-secondary" @click="showBorrowModal = false">Đóng</button>
                        <button 
                            type="button" 
                            class="btn btn-primary font-weight-bold" 
                            :disabled="borrowing"
                            @click="handleBorrowBook"
                        >
                            <span v-if="borrowing" class="spinner-border spinner-border-sm mr-1"></span>
                            <i v-else class="fas fa-check mr-1"></i> Xác nhận mượn
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
