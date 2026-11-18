<script>
import AdminBorrowRecordService from "@/services/admin/borrowRecord.service";
import AdminPenaltyService from "@/services/admin/penalty.service";

export default {
    name: "AdminBorrowRecordDetail",

    data() {
        return {
            recordId: this.$route.params.id,
            record: null,
            loading: false,
            errorMessage: "",
            successMessage: "",
            submitting: false,

            // Modal Tiếp nhận & Kiểm tra sách tại quầy
            showInspectModal: false,
            inspectCondition: "Normal",
            inspectNote: "",
            fineOverride: null,

            // Modal Xác minh mất sách do quá hạn
            showLostModal: false,
            lostReason: "",

            // Modal Tiếp nhận sách tìm lại
            showFoundModal: false,
            foundCondition: "Normal",
            foundNote: ""
        };
    },

    mounted() {
        this.fetchRecord();
    },

    methods: {
        async fetchRecord() {
            this.loading = true;
            try {
                const response = await AdminBorrowRecordService.getBorrowRecordById(this.recordId);
                if (response.success && response.data) {
                    this.record = response.data;
                } else {
                    this.errorMessage = response.message || "Không tìm thấy thông tin phiếu mượn.";
                }
            } catch (error) {
                console.error("Get record detail error:", error);
                this.errorMessage = "Không thể tải chi tiết phiếu mượn.";
            } finally {
                this.loading = false;
            }
        },

        // Mở modal kiểm tra tại quầy
        openInspectDialog() {
            this.inspectCondition = "Normal";
            this.inspectNote = "";
            this.fineOverride = null;
            this.showInspectModal = true;
        },

        // Thực hiện Tiếp nhận & Kiểm tra sách
        async handleInspectAndReturn() {
            this.submitting = true;
            try {
                const response = await AdminBorrowRecordService.inspectAndReturn(this.recordId, {
                    condition: this.inspectCondition,
                    conditionNote: this.inspectNote,
                    fineAmountOverride: this.fineOverride
                });

                if (response.success) {
                    this.successMessage = response.message || "Đã tiếp nhận và kiểm tra sách tại quầy thành công!";
                    this.showInspectModal = false;
                    await this.fetchRecord();
                    window.dispatchEvent(new CustomEvent("borrow-record-updated"));
                } else {
                    alert(response.message || "Không thể xử lý tiếp nhận sách.");
                }
            } catch (error) {
                console.error("Inspect return error:", error);
                alert("Đã xảy ra lỗi khi tiếp nhận sách.");
            } finally {
                this.submitting = false;
            }
        },

        // Mở modal xác minh mất sách (Quá hạn)
        openLostDialog() {
            this.lostReason = "Quá hạn mượn sách kéo dài, độc giả xác nhận không tìm thấy sách.";
            this.showLostModal = true;
        },

        // Xác minh mất sách
        async handleConfirmLost() {
            this.submitting = true;
            try {
                const response = await AdminBorrowRecordService.confirmLost(this.recordId, this.lostReason);
                if (response.success) {
                    this.successMessage = response.message || "Đã xác minh mất sách và tạo biên bản đền bù thành công!";
                    this.showLostModal = false;
                    await this.fetchRecord();
                    window.dispatchEvent(new CustomEvent("borrow-record-updated"));
                } else {
                    alert(response.message || "Không thể xác minh mất sách.");
                }
            } catch (error) {
                console.error("Confirm lost error:", error);
                alert("Đã xảy ra lỗi khi xác minh mất sách.");
            } finally {
                this.submitting = false;
            }
        },

        // Mở modal tiếp nhận sách tìm lại
        openFoundDialog() {
            this.foundCondition = "Normal";
            this.foundNote = "Độc giả mang sách đã báo mất đến quầy trả.";
            this.showFoundModal = true;
        },

        // Xác nhận tiếp nhận sách tìm lại
        async handleReturnFoundBook() {
            this.submitting = true;
            try {
                const response = await AdminPenaltyService.returnFoundBook({
                    borrowRecordId: this.recordId,
                    condition: this.foundCondition,
                    conditionNote: this.foundNote
                });

                if (response.success) {
                    this.successMessage = response.message || "Đã tiếp nhận sách tìm lại, cộng kho và hủy khoản bồi thường thành công!";
                    this.showFoundModal = false;
                    await this.fetchRecord();
                    window.dispatchEvent(new CustomEvent("borrow-record-updated"));
                } else {
                    alert(response.message || "Không thể tiếp nhận sách tìm lại.");
                }
            } catch (error) {
                console.error("Return found book error:", error);
                alert("Đã xảy ra lỗi khi xử lý sách tìm lại.");
            } finally {
                this.submitting = false;
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return "Chưa có";
            return new Date(dateStr).toLocaleString("vi-VN");
        },

        formatCurrency(amount) {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2
            }).format(amount || 0);
        },

        getStatusBadge(status) {
            switch (status) {
                case "ReturnPending":
                    return "badge-warning text-dark font-weight-bold";
                case "Borrowing":
                    return "badge-primary";
                case "Returned":
                    return "badge-success";
                case "Overdue":
                    return "badge-danger";
                case "Lost":
                    return "badge-dark";
                case "FoundReturned":
                    return "badge-info";
                default:
                    return "badge-secondary";
            }
        },

        translateStatus(status) {
            switch (status) {
                case "ReturnPending":
                    return "Chờ duyệt trả";
                case "Borrowing":
                    return "Đang mượn";
                case "Returned":
                    return "Đã trả";
                case "Overdue":
                    return "Quá hạn";
                case "Lost":
                    return "Đã báo mất";
                case "FoundReturned":
                    return "Đã tìm lại & Trả";
                default:
                    return status;
            }
        },

        translateCondition(condition) {
            switch (condition) {
                case "Normal":
                    return "Nguyên vẹn / Bình thường";
                case "LightDamage":
                    return "Trầy xước / Hư hại nhẹ";
                case "MediumDamage":
                    return "Hư hỏng vừa (Rách/Bẩn vừa)";
                case "HeavyDamage":
                    return "Hư hỏng nặng";
                case "Unrecoverable":
                    return "Không thể tái sử dụng";
                case "Lost":
                    return "Bị mất sách";
                default:
                    return condition || "Bình thường";
            }
        }
    }
};
</script>

<template>
    <div>
        <div class="d-flex align-items-center mb-4">
            <router-link :to="{ name: 'admin-borrow-records' }" class="btn btn-outline-secondary btn-sm mr-3">
                <i class="fas fa-arrow-left mr-1"></i> Quay lại danh sách
            </router-link>
            <div>
                <h3 class="font-weight-bold mb-0">Chi tiết Phiếu mượn sách</h3>
                <p class="text-muted small mb-0">Mã phiếu: {{ recordId }}</p>
            </div>
        </div>

        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
            <i class="fas fa-check-circle mr-1"></i> {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Đang tải thông tin phiếu mượn...</p>
        </div>

        <div v-else-if="record" class="card shadow-sm" style="max-width: 900px;">
            <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <h5 class="mb-0 font-weight-bold text-dark">
                    <i class="fas fa-file-invoice mr-2 text-primary"></i> Thông tin phiếu mượn
                </h5>
                <span :class="['badge px-3 py-2', getStatusBadge(record.status)]" style="font-size: 0.95rem;">
                    {{ translateStatus(record.status) }}
                </span>
            </div>
            <div class="card-body p-4">
                <div class="row">
                    <!-- Độc giả -->
                    <div class="col-md-6 mb-4">
                        <span class="text-muted d-block small mb-1">Thông tin Độc giả</span>
                        <div class="p-3 bg-light rounded">
                            <strong class="h6 text-primary d-block mb-1">{{ record.reader?.fullName || record.readerId }}</strong>
                            <div class="small text-muted">Mã ĐG: <strong>{{ record.readerId }}</strong></div>
                            <div v-if="record.reader?.phoneNumber" class="small text-muted">SĐT: {{ record.reader.phoneNumber }}</div>
                            <div v-if="record.reader?.email" class="small text-muted">Email: {{ record.reader.email }}</div>
                        </div>
                    </div>

                    <!-- Sách -->
                    <div class="col-md-6 mb-4">
                        <span class="text-muted d-block small mb-1">Thông tin Tựa sách</span>
                        <div class="p-3 bg-light rounded">
                            <strong class="h6 text-dark d-block mb-1">{{ record.book?.title || record.bookId }}</strong>
                            <div class="small text-muted">Mã sách: <strong>{{ record.bookId }}</strong></div>
                            <div v-if="record.book?.author" class="small text-muted">Tác giả: {{ record.book.author }}</div>
                            <div v-if="record.book?.price" class="small text-primary font-weight-bold">
                                Giá niêm yết bìa: {{ formatCurrency(record.book.price) }}
                            </div>
                        </div>
                    </div>

                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Người xác nhận cho mượn</span>
                        <span class="font-weight-semibold">
                            {{ record.employeeId === 'SYSTEM' ? 'Hệ thống trực tuyến (Online)' : (record.employeeId || 'Chưa xác định') }}
                        </span>
                    </div>

                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Nhân viên tiếp nhận tại quầy</span>
                        <span class="font-weight-semibold text-info">
                            {{ record.receivedByEmployeeId || 'Chưa tiếp nhận tại quầy' }}
                        </span>
                    </div>

                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Ngày mượn</span>
                        <strong class="text-dark">{{ formatDate(record.borrowDate) }}</strong>
                    </div>

                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Hạn trả sách</span>
                        <strong class="text-danger font-weight-bold">{{ formatDate(record.dueDate) }}</strong>
                    </div>

                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Ngày trả thực tế</span>
                        <span :class="record.returnDate ? 'text-success font-weight-bold' : 'text-muted font-italic'">
                            {{ record.returnDate ? formatDate(record.returnDate) : 'Chưa hoàn trả' }}
                        </span>
                    </div>

                    <div class="col-md-6 mb-3">
                        <span class="text-muted d-block small">Tình trạng thực tế lúc kiểm tra</span>
                        <span class="badge badge-light border px-2 py-1 font-weight-bold text-dark">
                            {{ translateCondition(record.actualCondition) }}
                        </span>
                    </div>

                    <div v-if="record.conditionNote" class="col-12 mb-3">
                        <span class="text-muted d-block small">Ghi chú tình trạng sách</span>
                        <div class="p-2 bg-light border rounded small text-dark">
                            <i class="fas fa-sticky-note text-warning mr-1"></i> {{ record.conditionNote }}
                        </div>
                    </div>
                </div>

                <!-- Action Toolbar: Các nút hành động xử lý nghiệp vụ thực tế -->
                <div class="mt-4 pt-3 border-top d-flex flex-wrap justify-content-end align-items-center">
                    <!-- Nút 1: Tiếp nhận & Kiểm tra sách tại quầy (Cho trạng thái Borrowing hoặc ReturnPending) -->
                    <button 
                        v-if="record.status === 'Borrowing' || record.status === 'ReturnPending'"
                        class="btn btn-primary font-weight-bold px-3 shadow-sm mr-2 mb-2" 
                        :disabled="submitting"
                        @click="openInspectDialog"
                        title="Tiếp nhận sách trực tiếp tại quầy, kiểm tra hư hại và áp dụng phạt nếu có"
                    >
                        <i class="fas fa-clipboard-check mr-1"></i> Tiếp nhận & Kiểm tra sách tại quầy
                    </button>

                    <!-- Nút 2: Xác minh mất sách do quá hạn (Cho trạng thái Overdue) -->
                    <button 
                        v-if="record.status === 'Overdue'"
                        class="btn btn-danger font-weight-bold px-3 shadow-sm mr-2 mb-2"
                        :disabled="submitting"
                        @click="openLostDialog"
                        title="Xác minh độc giả làm mất sách sau thời gian dài quá hạn"
                    >
                        <i class="fas fa-times-circle mr-1"></i> Xác minh mất sách (Quá hạn)
                    </button>

                    <!-- Nút 3: Tiếp nhận trả sách tìm lại (Cho trạng thái Lost) -->
                    <button 
                        v-if="record.status === 'Lost'"
                        class="btn btn-success font-weight-bold px-3 shadow-sm mb-2"
                        :disabled="submitting"
                        @click="openFoundDialog"
                        title="Độc giả tìm lại được cuốn sách này và mang đến trả"
                    >
                        <i class="fas fa-undo-alt mr-1"></i> Tiếp nhận sách tìm lại (Hủy phạt mất)
                    </button>
                </div>
            </div>
        </div>

        <!-- ==================== MODAL 1: TIẾP NHẬN & KIỂM TRA SÁCH TẠI QUẦY ==================== -->
        <div v-if="showInspectModal" class="modal-backdrop fade show" style="z-index: 1040;"></div>
        <div v-if="showInspectModal" class="modal fade show d-block" tabindex="-1" style="z-index: 1050;">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 490px; max-height: 92vh;">
                <div class="modal-content shadow-lg border-0" style="border-radius: 12px; max-height: 90vh;">
                    <div class="modal-header bg-primary text-white py-2 px-3">
                        <h6 class="modal-title font-weight-bold mb-0">
                            <i class="fas fa-clipboard-check mr-2"></i> Tiếp nhận & Kiểm tra sách tại quầy
                        </h6>
                        <button type="button" class="close text-white p-2" @click="showInspectModal = false">&times;</button>
                    </div>
                    <div class="modal-body p-3" style="font-size: 0.88rem;">
                        <!-- Thông tin sách gọn gàng -->
                        <div class="mb-2 p-2 bg-light rounded border d-flex justify-content-between align-items-center">
                            <div class="text-truncate mr-2">
                                <strong class="text-dark small d-block text-truncate">{{ record?.book?.title }} ({{ record?.bookId }})</strong>
                                <span class="text-muted" style="font-size: 0.78rem;">ĐG: {{ record?.reader?.fullName }} ({{ record?.readerId }})</span>
                            </div>
                            <span class="badge badge-primary py-1 px-2 flex-shrink-0" style="font-size: 0.75rem;">Tại quầy</span>
                        </div>

                        <!-- 5 Tùy chọn tình trạng sách thực tế gọn gàng -->
                        <div class="form-group mb-2">
                            <label class="font-weight-bold text-dark small mb-1">Tình trạng thực tế khi nhận sách <span class="text-danger">*</span></label>
                            
                            <div class="condition-list">
                                <!-- 1. Bình thường -->
                                <label class="d-flex align-items-center p-2 rounded border mb-1 cursor-pointer transition-all" :class="{'bg-light border-primary shadow-sm': inspectCondition === 'Normal'}">
                                    <input type="radio" v-model="inspectCondition" value="Normal" class="mr-2" />
                                    <span class="small flex-grow-1 text-dark"><strong>Bình thường / Tốt:</strong> Nhập kho (+1), không phạt</span>
                                    <span class="badge badge-success py-1 px-2 ml-1" style="font-size: 0.72rem;">+1 kho</span>
                                </label>

                                <!-- 2. Trầy xước / Hư nhẹ -->
                                <label class="d-flex align-items-center p-2 rounded border mb-1 cursor-pointer transition-all" :class="{'bg-light border-warning shadow-sm': inspectCondition === 'LightDamage'}">
                                    <input type="radio" v-model="inspectCondition" value="LightDamage" class="mr-2" />
                                    <span class="small flex-grow-1 text-dark"><strong>Trầy xước / Hư nhẹ:</strong> Tái dùng (+1 kho)</span>
                                    <span class="badge badge-warning text-dark py-1 px-2 ml-1" style="font-size: 0.72rem;">Phạt bậc lũy tiến</span>
                                </label>

                                <!-- 3. Hư vừa -->
                                <label class="d-flex align-items-center p-2 rounded border mb-1 cursor-pointer transition-all" :class="{'bg-light border-warning shadow-sm': inspectCondition === 'MediumDamage'}">
                                    <input type="radio" v-model="inspectCondition" value="MediumDamage" class="mr-2" />
                                    <span class="small flex-grow-1 text-dark"><strong>Hư vừa (rách/bẩn trang):</strong> Tái dùng (+1 kho)</span>
                                    <span class="badge badge-warning text-dark py-1 px-2 ml-1" style="font-size: 0.72rem;">Phạt bậc lũy tiến</span>
                                </label>

                                <!-- 4. Hư nặng -->
                                <label class="d-flex align-items-center p-2 rounded border mb-1 cursor-pointer transition-all" :class="{'bg-light border-danger shadow-sm': inspectCondition === 'HeavyDamage'}">
                                    <input type="radio" v-model="inspectCondition" value="HeavyDamage" class="mr-2" />
                                    <span class="small flex-grow-1 text-danger font-weight-bold">Hư nặng không tái dùng: Không cộng kho</span>
                                    <span class="badge badge-danger py-1 px-2 ml-1" style="font-size: 0.72rem;">Đền 100% bìa</span>
                                </label>

                                <!-- 5. Báo mất -->
                                <label class="d-flex align-items-center p-2 rounded border mb-0 cursor-pointer transition-all" :class="{'bg-light border-dark shadow-sm': inspectCondition === 'Lost'}">
                                    <input type="radio" v-model="inspectCondition" value="Lost" class="mr-2" />
                                    <span class="small flex-grow-1 text-danger font-weight-bold">Báo mất sách tại quầy: Không cộng kho</span>
                                    <span class="badge badge-dark py-1 px-2 ml-1" style="font-size: 0.72rem;">Đền 100% bìa</span>
                                </label>
                            </div>
                        </div>

                        <!-- Ghi chú thực tế -->
                        <div class="form-group mb-2">
                            <label class="font-weight-bold text-dark small mb-1">Ghi chú tình trạng sách thực tế</label>
                            <textarea 
                                v-model="inspectNote" 
                                rows="2" 
                                class="form-control form-control-sm" 
                                placeholder="Ghi chú vị trí trầy xước, rách trang hoặc hiện trạng..."
                            ></textarea>
                        </div>

                        <!-- Mức phạt điều chỉnh tùy chọn -->
                        <div v-if="inspectCondition !== 'Normal'" class="form-group mb-0">
                            <label class="font-weight-bold text-dark small mb-1">Mức phạt điều chỉnh (USD, để trống để tự động tính):</label>
                            <input 
                                v-model.number="fineOverride" 
                                type="number" 
                                step="0.01" 
                                min="0" 
                                class="form-control form-control-sm" 
                                placeholder="Tự động áp dụng theo quy chế..."
                            />
                        </div>
                    </div>
                    <div class="modal-footer bg-light py-2 px-3 border-top d-flex justify-content-end">
                        <button type="button" class="btn btn-secondary btn-sm px-3" @click="showInspectModal = false">Hủy bỏ</button>
                        <button 
                            type="button" 
                            class="btn btn-primary btn-sm font-weight-bold px-3 shadow-sm"
                            :disabled="submitting"
                            @click="handleInspectAndReturn"
                        >
                            <span v-if="submitting" class="spinner-border spinner-border-sm mr-1"></span>
                            <i v-else class="fas fa-check mr-1"></i> Xác nhận hoàn tất
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== MODAL 2: XÁC MINH MẤT SÁCH (QUÁ HẠN) ==================== -->
        <div v-if="showLostModal" class="modal-backdrop fade show" style="z-index: 1040;"></div>
        <div v-if="showLostModal" class="modal fade show d-block" tabindex="-1" style="z-index: 1050;">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 480px; max-height: 90vh;">
                <div class="modal-content shadow-lg border-0" style="border-radius: 12px;">
                    <div class="modal-header bg-danger text-white py-2 px-3">
                        <h6 class="modal-title font-weight-bold mb-0">
                            <i class="fas fa-exclamation-triangle mr-2"></i> Xác minh mất sách do quá hạn
                        </h6>
                        <button type="button" class="close text-white p-2" @click="showLostModal = false">&times;</button>
                    </div>
                    <div class="modal-body p-3">
                        <p class="text-muted small mb-2">
                            Hệ thống sẽ chuyển trạng thái sang <strong>Mất sách (Lost)</strong>, không cộng kho và lập biên bản phạt bồi thường <strong>100% giá bìa ({{ formatCurrency(record?.book?.price) }})</strong>.
                        </p>
                        <div class="form-group mb-0">
                            <label class="font-weight-bold text-dark small mb-1">Lý do / Biên bản ghi chú <span class="text-danger">*</span></label>
                            <textarea 
                                v-model="lostReason" 
                                rows="2" 
                                class="form-control form-control-sm" 
                                required
                            ></textarea>
                        </div>
                    </div>
                    <div class="modal-footer bg-light py-2 px-3 border-top">
                        <button type="button" class="btn btn-secondary btn-sm" @click="showLostModal = false">Hủy</button>
                        <button 
                            type="button" 
                            class="btn btn-danger btn-sm font-weight-bold px-3"
                            :disabled="submitting"
                            @click="handleConfirmLost"
                        >
                            <span v-if="submitting" class="spinner-border spinner-border-sm mr-1"></span>
                            <i v-else class="fas fa-check mr-1"></i> Xác nhận mất sách & Lập phạt
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== MODAL 3: TIẾP NHẬN SÁCH TÌM LẠI ==================== -->
        <div v-if="showFoundModal" class="modal-backdrop fade show" style="z-index: 1040;"></div>
        <div v-if="showFoundModal" class="modal fade show d-block" tabindex="-1" style="z-index: 1050;">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 480px; max-height: 90vh;">
                <div class="modal-content shadow-lg border-0" style="border-radius: 12px;">
                    <div class="modal-header bg-success text-white py-2 px-3">
                        <h6 class="modal-title font-weight-bold mb-0">
                            <i class="fas fa-undo mr-2"></i> Tiếp nhận sách tìm lại sau khi đã báo mất
                        </h6>
                        <button type="button" class="close text-white p-2" @click="showFoundModal = false">&times;</button>
                    </div>
                    <div class="modal-body p-3">
                        <div class="alert alert-info py-2 px-3 small mb-2">
                            <i class="fas fa-info-circle mr-1"></i> Sách sẽ được <strong>nhập lại kho (+1)</strong> và khoản phạt mất sách sẽ được <strong>hủy bỏ (Cancelled)</strong>.
                        </div>

                        <div class="form-group mb-2">
                            <label class="font-weight-bold text-dark small mb-1">Tình trạng thực tế của cuốn sách tìm lại</label>
                            <select v-model="foundCondition" class="form-control form-control-sm">
                                <option value="Normal">Nguyên vẹn / Tốt (Hủy hoàn toàn tiền phạt)</option>
                                <option value="LightDamage">Trầy xước nhẹ (Hủy phạt mất, chuyển phạt trầy nhẹ)</option>
                                <option value="MediumDamage">Hư vừa (Hủy phạt mất, chuyển phạt hư vừa)</option>
                            </select>
                        </div>

                        <div class="form-group mb-0">
                            <label class="font-weight-bold text-dark small mb-1">Ghi chú tiếp nhận</label>
                            <input v-model="foundNote" type="text" class="form-control form-control-sm" placeholder="Ghi chú thêm..." />
                        </div>
                    </div>
                    <div class="modal-footer bg-light py-2 px-3 border-top">
                        <button type="button" class="btn btn-secondary btn-sm" @click="showFoundModal = false">Hủy</button>
                        <button 
                            type="button" 
                            class="btn btn-success btn-sm font-weight-bold px-3"
                            :disabled="submitting"
                            @click="handleReturnFoundBook"
                        >
                            <span v-if="submitting" class="spinner-border spinner-border-sm mr-1"></span>
                            <i v-else class="fas fa-check mr-1"></i> Xác nhận nhập kho & Hủy phạt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>