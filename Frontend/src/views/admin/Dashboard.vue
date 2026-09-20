<script>
import AdminBookService from "@/services/admin/book.service";
import AdminReaderService from "@/services/admin/reader.service";
import AdminPublisherService from "@/services/admin/publisher.service";
import AdminAuthService from "@/services/admin/auth.service";

export default {
    name: "AdminDashboard",

    data() {
        return {
            employee: null,
            bookCount: 0,
            readerCount: 0,
            publisherCount: 0,
            recentBooks: [],
            loading: false
        };
    },

    mounted() {
        this.employee = AdminAuthService.getCurrentEmployee();
        this.fetchDashboardData();
    },

    methods: {
        async fetchDashboardData() {
            this.loading = true;
            try {
                const [booksRes, readersRes, publishersRes] = await Promise.allSettled([
                    AdminBookService.getAllBooks(),
                    AdminReaderService.getAllReaders(),
                    AdminPublisherService.getAllPublishers()
                ]);

                if (booksRes.status === "fulfilled" && booksRes.value.success) {
                    this.bookCount = booksRes.value.count || booksRes.value.data?.length || 0;
                    this.recentBooks = (booksRes.value.data || []).slice(0, 5);
                }

                if (readersRes.status === "fulfilled" && readersRes.value.success) {
                    this.readerCount = readersRes.value.data?.length || 0;
                }

                if (publishersRes.status === "fulfilled" && publishersRes.value.success) {
                    this.publisherCount = publishersRes.value.data?.length || 0;
                }
            } catch (error) {
                console.error("Fetch dashboard data error:", error);
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>

<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h3 class="font-weight-bold mb-1">Bảng điều khiển</h3>
                <p class="text-muted mb-0">
                    Chào mừng trở lại, <span class="font-weight-bold text-primary">{{ employee?.fullName || employee?.username || "Quản trị viên" }}</span>!
                </p>
            </div>
            <div>
                <button class="btn btn-outline-primary btn-sm" @click="fetchDashboardData">
                    <i class="fas fa-sync-alt mr-1"></i> Làm mới
                </button>
            </div>
        </div>

        <!-- Metric Cards -->
        <div class="row mb-4">
            <div class="col-sm-6 col-lg-4 mb-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body d-flex align-items-center">
                        <div class="avatar-circle mr-3" style="width: 50px; height: 50px; background: #e0e7ff; color: #3b82f6; font-size: 1.25rem;">
                            <i class="fas fa-book"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Tổng số tựa sách</div>
                            <div class="h3 font-weight-bold mb-0 text-dark">{{ bookCount }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-sm-6 col-lg-4 mb-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body d-flex align-items-center">
                        <div class="avatar-circle mr-3" style="width: 50px; height: 50px; background: #dcfce7; color: #10b981; font-size: 1.25rem;">
                            <i class="fas fa-users"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Tổng số độc giả</div>
                            <div class="h3 font-weight-bold mb-0 text-dark">{{ readerCount }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-sm-6 col-lg-4 mb-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body d-flex align-items-center">
                        <div class="avatar-circle mr-3" style="width: 50px; height: 50px; background: #fef3c7; color: #f59e0b; font-size: 1.25rem;">
                            <i class="fas fa-building"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Nhà xuất bản</div>
                            <div class="h3 font-weight-bold mb-0 text-dark">{{ publisherCount }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick actions & Recent books -->
        <div class="row">
            <div class="col-lg-8 mb-4">
                <div class="card shadow-sm">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span class="font-weight-bold text-dark"><i class="fas fa-list mr-2 text-primary"></i> Sách mới cập nhật</span>
                        <router-link :to="{ name: 'admin-books' }" class="small text-primary font-weight-semibold">Xem tất cả &rarr;</router-link>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Mã sách</th>
                                    <th>Tên sách</th>
                                    <th>Tác giả</th>
                                    <th>Số lượng</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="loading">
                                    <td colspan="4" class="text-center py-4">Đang tải dữ liệu...</td>
                                </tr>
                                <tr v-else-if="recentBooks.length === 0">
                                    <td colspan="4" class="text-center py-4 text-muted">Chưa có dữ liệu sách nào.</td>
                                </tr>
                                <tr v-else v-for="b in recentBooks" :key="b.bookId">
                                    <td class="font-weight-bold text-primary">{{ b.bookId }}</td>
                                    <td>{{ b.title }}</td>
                                    <td>{{ b.author }}</td>
                                    <td>
                                        <span :class="['badge', b.quantity > 0 ? 'badge-success' : 'badge-danger']">
                                            {{ b.quantity }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-lg-4 mb-4">
                <div class="card shadow-sm">
                    <div class="card-header font-weight-bold text-dark">
                        <i class="fas fa-bolt mr-2 text-warning"></i> Thao tác nhanh
                    </div>
                    <div class="card-body">
                        <router-link :to="{ name: 'admin-book-add' }" class="btn btn-outline-primary btn-block text-left mb-2">
                            <i class="fas fa-plus mr-2"></i> Thêm sách mới vào kho
                        </router-link>
                        <router-link :to="{ name: 'admin-reader-add' }" class="btn btn-outline-success btn-block text-left mb-2">
                            <i class="fas fa-user-plus mr-2"></i> Đăng ký độc giả mới
                        </router-link>
                        <router-link :to="{ name: 'admin-publisher-add' }" class="btn btn-outline-warning btn-block text-left mb-2">
                            <i class="fas fa-building mr-2"></i> Thêm Nhà xuất bản
                        </router-link>
                        <router-link :to="{ name: 'admin-borrow-records' }" class="btn btn-outline-info btn-block text-left">
                            <i class="fas fa-clipboard-check mr-2"></i> Quản lý mượn trả sách
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
