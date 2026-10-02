<script>
import ClientBorrowRecordService from "@/services/client/borrowRecord.service";
import ClientAuthService from "@/services/client/auth.service";

export default {
    name: "ClientReturnBook",

    data() {
        return {
            reader: null,
            borrowingBooks: [],
            returnedRecently: [],
            loading: false,
            returningId: null,
            searchQuery: "",
            successMessage: "",
            errorMessage: ""
        };
    },

    computed: {
        filteredBooks() {
            if (!this.searchQuery.trim()) {
                return this.borrowingBooks;
            }
            const q = this.searchQuery.toLowerCase();
            return this.borrowingBooks.filter(item => {
                return (
                    item.bookId.toLowerCase().includes(q) ||
                    (item.bookTitle && item.bookTitle.toLowerCase().includes(q)) ||
                    (item.book?.author && item.book.author.toLowerCase().includes(q))
                );
            });
        }
    },

    mounted() {
        this.reader = ClientAuthService.getCurrentReader();
        if (this.reader) {
            this.fetchBorrowingBooks();
        }
        window.addEventListener("borrow-record-updated", this.fetchBorrowingBooks);
        window.addEventListener("reader-auth-change", this.handleAuthChange);
    },

    beforeUnmount() {
        window.removeEventListener("borrow-record-updated", this.fetchBorrowingBooks);
        window.removeEventListener("reader-auth-change", this.handleAuthChange);
    },

    methods: {
        handleAuthChange() {
            this.reader = ClientAuthService.getCurrentReader();
            if (this.reader) {
                this.fetchBorrowingBooks();
            } else {
                this.borrowingBooks = [];
            }
        },

        async fetchBorrowingBooks() {
            this.loading = true;
            this.errorMessage = "";
            try {
                const response = await ClientBorrowRecordService.getMyBorrowRecords();
                if (response.success && response.data) {
                    // Lấy các phiếu đang mượn hoặc đang chờ duyệt trả
                    this.borrowingBooks = response.data.filter(
                        r => r.status === "Borrowing" || r.status === "ReturnPending"
                    );
                }
            } catch (error) {
                console.error("Fetch borrowing books error:", error);
                this.errorMessage = "Không thể tải danh sách sách đang mượn.";
            } finally {
                this.loading = false;
            }
        },

        async handleReturnBook(record) {
            const bookTitle = record.bookTitle || record.bookId;
            if (!confirm(`Bạn có chắc chắn muốn gửi yêu cầu trả cuốn sách "${bookTitle}" đến Quản trị viên không?`)) {
                return;
            }

            this.returningId = record._id;
            this.errorMessage = "";
            this.successMessage = "";

            try {
                const response = await ClientBorrowRecordService.returnBook(record._id);
                if (response.success) {
                    this.successMessage = `Đã gửi yêu cầu trả cuốn sách "${bookTitle}" thành công! Vui lòng chờ Quản trị viên kiểm tra và duyệt hoàn tất.`;

                    // Đồng bộ lại danh sách để hiển thị trạng thái Chờ duyệt trả
                    await this.fetchBorrowingBooks();

                    // Kích hoạt cập nhật
                    window.dispatchEvent(new CustomEvent("borrow-record-updated"));
                } else {
                    this.errorMessage = response.message || "Không thể gửi yêu cầu trả sách.";
                }
            } catch (error) {
                console.error("Return book error:", error);
                this.errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi gửi yêu cầu trả sách.";
            } finally {
                this.returningId = null;
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return "-";
            return new Date(dateStr).toLocaleDateString("vi-VN");
        },

        isOverdue(dueDateStr) {
            if (!dueDateStr) return false;
            return new Date(dueDateStr) < new Date();
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
    <div class="py-3">
        <!-- Header banner -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
            <div>
                <h2 class="font-weight-bold text-dark mb-1">
                    <i class="fas fa-undo-alt text-success mr-2"></i> Hoàn Trả Sách Trực Tuyến
                </h2>
                <p class="text-muted mb-0">
                    Danh sách các đầu sách bạn đang mượn. Nhấn nút <strong>Trả sách</strong> để hoàn tất thủ tục trả sách ngay lập tức.
                </p>
            </div>
            <div class="mt-3 mt-md-0 d-flex align-items-center">
                <router-link :to="{ name: 'client-borrow-records' }" class="btn btn-outline-primary btn-sm mr-2 shadow-sm font-weight-semibold">
                    <i class="fas fa-history mr-1"></i> Lịch sử mượn trả
                </router-link>
                <button class="btn btn-light border btn-sm shadow-sm" @click="fetchBorrowingBooks" :disabled="loading">
                    <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i> Làm mới
                </button>
            </div>
        </div>

        <!-- Thông báo thành công nổi bật -->
        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show shadow-sm border-0 py-3" style="background-color: #d1fae5; color: #065f46; border-radius: 10px;">
            <div class="d-flex align-items-center">
                <i class="fas fa-check-circle fa-2x mr-3 text-success"></i>
                <div>
                    <h5 class="font-weight-bold mb-1">Thông báo hoàn tất!</h5>
                    <div>{{ successMessage }}</div>
                    <small class="text-muted d-block mt-1">
                        <i class="fas fa-bell text-primary mr-1"></i> Chuông thông báo phía trên đã ghi nhận thông báo mới.
                    </small>
                </div>
            </div>
            <button type="button" class="close" @click="successMessage = ''">&times;</button>
        </div>

        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show shadow-sm border-0 py-3" style="border-radius: 10px;">
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle fa-2x mr-3 text-danger"></i>
                <div>
                    <h5 class="font-weight-bold mb-1">Thao tác không thành công</h5>
                    <div>{{ errorMessage }}</div>
                </div>
            </div>
            <button type="button" class="close" @click="errorMessage = ''">&times;</button>
        </div>

        <!-- Trường hợp chưa đăng nhập -->
        <div v-if="!reader" class="card shadow-sm border-0 p-5 text-center my-4" style="border-radius: 16px;">
            <div class="avatar-circle mx-auto mb-3 bg-light text-primary" style="width: 70px; height: 70px; font-size: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-user-lock"></i>
            </div>
            <h4 class="font-weight-bold text-dark mb-2">Vui lòng đăng nhập tài khoản Độc giả</h4>
            <p class="text-muted mb-4" style="max-width: 500px; margin: 0 auto;">
                Bạn cần đăng nhập mã độc giả để xem danh sách sách đang mượn và thực hiện thao tác trả sách trực tuyến.
            </p>
            <div>
                <router-link :to="{ name: 'client-login', query: { redirect: $route.fullPath } }" class="btn btn-primary btn-lg px-4 shadow-sm font-weight-bold">
                    <i class="fas fa-sign-in-alt mr-2"></i> Đăng nhập Độc giả ngay
                </router-link>
            </div>
        </div>

        <!-- Khi đã đăng nhập -->
        <div v-else>
            <!-- Thống kê nhanh & Ô tìm kiếm -->
            <div class="row mb-4">
                <div class="col-md-6 mb-3 mb-md-0">
                    <div class="d-flex align-items-center p-3 bg-white rounded shadow-sm border">
                        <div class="avatar-circle mr-3 bg-primary-light text-primary" style="width: 48px; height: 48px; font-size: 1.3rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #e0f2fe;">
                            <i class="fas fa-book-reader"></i>
                        </div>
                        <div>
                            <span class="text-muted small d-block">Độc giả đang đăng nhập:</span>
                            <strong class="text-dark">{{ reader.fullName }} ({{ reader.readerId }})</strong>
                        </div>
                        <div class="ml-auto text-right">
                            <span class="badge badge-primary px-3 py-2 font-weight-bold" style="font-size: 0.9rem;">
                                {{ borrowingBooks.length }} cuốn đang mượn
                            </span>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="input-group h-100 shadow-sm">
                        <div class="input-group-prepend">
                            <span class="input-group-text bg-white border-right-0"><i class="fas fa-search text-muted"></i></span>
                        </div>
                        <input 
                            v-model="searchQuery" 
                            type="text" 
                            class="form-control border-left-0" 
                            placeholder="Lọc nhanh sách theo mã sách, tên sách hoặc tác giả..." 
                        />
                    </div>
                </div>
            </div>

            <!-- Loading Spinner -->
            <div v-if="loading && borrowingBooks.length === 0" class="text-center py-5">
                <div class="spinner-border text-primary spinner-border-lg"></div>
                <p class="mt-2 text-muted">Đang tải danh sách sách đang mượn...</p>
            </div>

            <!-- Không có sách nào đang mượn -->
            <div v-else-if="borrowingBooks.length === 0" class="card shadow-sm border-0 p-5 text-center my-4" style="border-radius: 16px;">
                <div class="avatar-circle mx-auto mb-3 text-success" style="width: 70px; height: 70px; font-size: 2.2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #dcfce7;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h4 class="font-weight-bold text-dark mb-2">Bạn không có sách nào đang mượn cần hoàn trả!</h4>
                <p class="text-muted mb-4" style="max-width: 480px; margin: 0 auto;">
                    Tất cả các đầu sách bạn mượn đã được hoàn trả thành công hoặc bạn chưa đăng ký mượn sách mới.
                </p>
                <div>
                    <router-link :to="{ name: 'client-books' }" class="btn btn-primary px-4 shadow-sm font-weight-bold">
                        <i class="fas fa-book mr-2"></i> Khám phá kho sách & Mượn sách
                    </router-link>
                </div>
            </div>

            <!-- Danh sách sách đang mượn -->
            <div v-else>
                <div class="row">
                    <div 
                        v-for="record in filteredBooks" 
                        :key="record._id" 
                        class="col-md-6 col-lg-4 mb-4"
                    >
                        <div class="card h-100 shadow-sm border-0 return-card position-relative" style="border-radius: 14px; overflow: hidden;">
                            <!-- Trạng thái badge -->
                            <div v-if="record.status === 'ReturnPending'" class="position-absolute" style="top: 12px; right: 12px; z-index: 2;">
                                <span class="badge badge-warning text-dark px-2 py-1 shadow-sm font-weight-bold">
                                    <i class="fas fa-clock mr-1"></i> Chờ duyệt trả
                                </span>
                            </div>
                            <div v-else-if="isOverdue(record.dueDate)" class="position-absolute" style="top: 12px; right: 12px; z-index: 2;">
                                <span class="badge badge-danger px-2 py-1 shadow-sm font-weight-bold">
                                    <i class="fas fa-exclamation-circle mr-1"></i> Đã quá hạn
                                </span>
                            </div>

                            <div class="card-body p-3 d-flex flex-column">
                                <div class="d-flex mb-3">
                                    <div class="book-thumbnail mr-3 shadow-sm rounded overflow-hidden" style="width: 80px; height: 110px; flex-shrink: 0; background: #f1f5f9;">
                                        <img 
                                            :src="getBookImage(record.book?.image)" 
                                            :alt="record.bookTitle" 
                                            class="w-100 h-100" 
                                            style="object-fit: cover;"
                                            @error="handleImageError"
                                        />
                                    </div>
                                    <div class="flex-grow-1 overflow-hidden">
                                        <span class="badge badge-light border text-primary font-weight-bold mb-1">
                                            Mã: {{ record.bookId }}
                                        </span>
                                        <h6 class="font-weight-bold text-dark text-truncate mb-1" :title="record.bookTitle">
                                            {{ record.bookTitle || record.bookId }}
                                        </h6>
                                        <div class="text-muted small text-truncate mb-1" v-if="record.book?.author">
                                            <i class="fas fa-user-edit mr-1"></i> {{ record.book.author }}
                                        </div>
                                        <div class="small">
                                            <span class="text-muted">Ngày mượn:</span> 
                                            <strong>{{ formatDate(record.borrowDate) }}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div class="p-2 rounded mb-3 small" :class="isOverdue(record.dueDate) ? 'bg-danger-light text-danger' : 'bg-light text-dark'" style="background: #f8fafc;">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span><i class="fas fa-calendar-alt mr-1"></i> Hạn trả sách:</span>
                                        <strong :class="{ 'text-danger font-weight-bold': isOverdue(record.dueDate) }">
                                            {{ formatDate(record.dueDate) }}
                                        </strong>
                                    </div>
                                </div>

                                <!-- Nút yêu cầu trả sách hoặc hiển thị Đang chờ duyệt -->
                                <button 
                                    v-if="record.status === 'ReturnPending'"
                                    class="btn btn-warning text-dark btn-block py-2 font-weight-bold shadow-sm mt-auto"
                                    disabled
                                >
                                    <i class="fas fa-hourglass-half mr-1"></i> Đang chờ Admin duyệt
                                </button>

                                <button 
                                    v-else
                                    class="btn btn-success btn-block py-2 font-weight-bold shadow-sm mt-auto return-btn"
                                    :disabled="returningId === record._id"
                                    @click="handleReturnBook(record)"
                                >
                                    <span v-if="returningId === record._id" class="spinner-border spinner-border-sm mr-1"></span>
                                    <i v-else class="fas fa-undo-alt mr-1"></i>
                                    Yêu cầu trả cuốn sách này
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Mục sách vừa trả thành công gần đây -->
                <div v-if="returnedRecently.length > 0" class="mt-4 pt-3 border-top">
                    <h5 class="font-weight-bold text-dark mb-3">
                        <i class="fas fa-check-double text-success mr-2"></i> Sách vừa hoàn trả trong phiên này
                    </h5>
                    <div class="row">
                        <div v-for="item in returnedRecently" :key="item._id" class="col-md-6 mb-2">
                            <div class="d-flex align-items-center p-3 bg-light rounded border border-success">
                                <i class="fas fa-check-circle text-success fa-lg mr-3"></i>
                                <div class="flex-grow-1 text-truncate">
                                    <strong class="text-dark">{{ item.bookTitle || item.bookId }}</strong>
                                    <span class="text-muted small d-block">Mã: {{ item.bookId }} | Lúc: {{ item.returnedAt }}</span>
                                </div>
                                <span class="badge badge-success px-2 py-1">Đã trả xong</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.return-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: 1px solid #e2e8f0 !important;
}

.return-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08) !important;
}

.return-btn {
    border-radius: 8px;
    letter-spacing: 0.3px;
    transition: all 0.2s ease;
}

.return-btn:hover {
    transform: scale(1.02);
}

.bg-danger-light {
    background-color: #fee2e2 !important;
}
</style>
