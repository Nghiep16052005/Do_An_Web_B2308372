<script>
import AdminBookService from "@/services/admin/book.service";
import AdminPublisherService from "@/services/admin/publisher.service";

export default {
    name: "AdminBookEdit",

    data() {
        return {
            bookId: this.$route.params.id,
            formData: {
                title: "",
                author: "",
                publisherId: "",
                publicationYear: 2024,
                price: 0,
                quantity: 0,
                image: ""
            },
            publishers: [],
            loading: false,
            saving: false,
            errorMessage: ""
        };
    },

    async mounted() {
        await Promise.all([this.fetchPublishers(), this.fetchBook()]);
    },

    methods: {
        async fetchPublishers() {
            try {
                const response = await AdminPublisherService.getAllPublishers();
                if (response.success) {
                    this.publishers = response.data || [];
                }
            } catch (error) {
                console.error("Fetch publishers error:", error);
            }
        },

        async fetchBook() {
            this.loading = true;
            try {
                const response = await AdminBookService.getBookById(this.bookId);
                if (response.success && response.data) {
                    const b = response.data;
                    this.formData = {
                        title: b.title,
                        author: b.author,
                        publisherId: b.publisherId,
                        publicationYear: b.publicationYear,
                        price: b.price,
                        quantity: b.quantity,
                        image: b.image || ""
                    };
                } else {
                    this.errorMessage = response.message || "Không tìm thấy thông tin sách.";
                }
            } catch (error) {
                console.error("Get book error:", error);
                this.errorMessage = "Không thể tải dữ liệu cuốn sách.";
            } finally {
                this.loading = false;
            }
        },

        async handleSubmit() {
            this.saving = true;
            this.errorMessage = "";

            try {
                const response = await AdminBookService.updateBook(this.bookId, {
                    ...this.formData,
                    publicationYear: Number(this.formData.publicationYear),
                    price: Number(this.formData.price),
                    quantity: Number(this.formData.quantity),
                    image: this.formData.image.trim() || "/images/default-book.svg"
                });

                if (response.success) {
                    this.$router.push({ name: "admin-books" });
                } else {
                    this.errorMessage = response.message || "Cập nhật sách thất bại.";
                }
            } catch (error) {
                console.error("Update book error:", error);
                this.errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi cập nhật sách.";
            } finally {
                this.saving = false;
            }
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
        <div class="d-flex align-items-center mb-4">
            <router-link :to="{ name: 'admin-books' }" class="btn btn-outline-secondary btn-sm mr-3">
                <i class="fas fa-arrow-left mr-1"></i> Quay lại
            </router-link>
            <div>
                <h3 class="font-weight-bold mb-0">Chỉnh sửa sách</h3>
                <p class="text-muted small mb-0">Mã sách: <span class="font-weight-bold text-primary">{{ bookId }}</span></p>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Đang tải thông tin sách...</p>
        </div>

        <div v-else class="card shadow-sm" style="max-width: 800px;">
            <div class="card-body p-4">
                <form @submit.prevent="handleSubmit">
                    <div class="row">
                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Mã sách</label>
                            <input 
                                :value="bookId" 
                                type="text" 
                                class="form-control" 
                                disabled 
                            />
                            <small class="text-muted">Mã sách không thể thay đổi</small>
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Tên sách <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.title" 
                                type="text" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Tác giả <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.author" 
                                type="text" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Nhà xuất bản <span class="text-danger">*</span></label>
                            <select 
                                v-if="publishers.length > 0" 
                                v-model="formData.publisherId" 
                                class="form-control" 
                                required
                            >
                                <option v-for="p in publishers" :key="p.publisherId" :value="p.publisherId">
                                    {{ p.name }} ({{ p.publisherId }})
                                </option>
                            </select>
                            <input 
                                v-else 
                                v-model.trim="formData.publisherId" 
                                type="text" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-md-4 form-group">
                            <label class="font-weight-semibold">Năm xuất bản <span class="text-danger">*</span></label>
                            <input 
                                v-model.number="formData.publicationYear" 
                                type="number" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-md-4 form-group">
                            <label class="font-weight-semibold">Đơn giá ($) <span class="text-danger">*</span></label>
                            <input 
                                v-model.number="formData.price" 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-md-4 form-group">
                            <label class="font-weight-semibold">Số lượng trong kho <span class="text-danger">*</span></label>
                            <input 
                                v-model.number="formData.quantity" 
                                type="number" 
                                min="0" 
                                class="form-control" 
                                required 
                            />
                        </div>

                        <div class="col-12 form-group">
                            <label class="font-weight-semibold">Đường dẫn ảnh bìa sách (Ảnh trong public hoặc URL)</label>
                            <div class="input-group">
                                <input 
                                    v-model.trim="formData.image" 
                                    type="text" 
                                    class="form-control" 
                                    placeholder="Ví dụ: /images/1.webp hoặc https://..." 
                                />
                                <div v-if="formData.image" class="input-group-append">
                                    <button class="btn btn-outline-secondary" type="button" @click="formData.image = ''">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            <small class="text-muted d-block mt-1">Các ảnh trong thư mục Frontend/public/images có dạng: <code>/images/1.webp</code>, <code>/images/2.webp</code>,...</small>
                            <div v-if="formData.image" class="mt-2 d-flex align-items-center">
                                <span class="small text-muted mr-2">Xem trước:</span>
                                <img 
                                    :src="getBookImage(formData.image)" 
                                    alt="Preview" 
                                    class="rounded shadow-sm border"
                                    style="height: 60px; width: 45px; object-fit: cover;"
                                    @error="handleImageError"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 pt-3 border-top d-flex justify-content-end">
                        <router-link :to="{ name: 'admin-books' }" class="btn btn-secondary mr-2">
                            Hủy bỏ
                        </router-link>
                        <button type="submit" class="btn btn-primary font-weight-semibold" :disabled="saving">
                            <span v-if="saving" class="spinner-border spinner-border-sm mr-1"></span>
                            <i v-else class="fas fa-save mr-1"></i> Cập nhật thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
