<script>
import AdminBookService from "@/services/admin/book.service";
import AdminPublisherService from "@/services/admin/publisher.service";

export default {
    name: "AdminBookAdd",

    data() {
        return {
            formData: {
                bookId: "",
                title: "",
                author: "",
                publisherId: "",
                publicationYear: new Date().getFullYear(),
                price: 0,
                quantity: 1,
                image: ""
            },
            publishers: [],
            loading: false,
            errorMessage: ""
        };
    },

    mounted() {
        this.fetchPublishers();
    },

    methods: {
        async fetchPublishers() {
            try {
                const response = await AdminPublisherService.getAllPublishers();
                if (response.success) {
                    this.publishers = response.data || [];
                    if (this.publishers.length > 0 && !this.formData.publisherId) {
                        this.formData.publisherId = this.publishers[0].publisherId;
                    }
                }
            } catch (error) {
                console.error("Fetch publishers error:", error);
            }
        },

        async handleSubmit() {
            this.loading = true;
            this.errorMessage = "";

            try {
                const response = await AdminBookService.createBook({
                    ...this.formData,
                    publicationYear: Number(this.formData.publicationYear),
                    price: Number(this.formData.price),
                    quantity: Number(this.formData.quantity),
                    image: this.formData.image.trim() || "/images/default-book.svg"
                });

                if (response.success) {
                    this.$router.push({ name: "admin-books" });
                } else {
                    this.errorMessage = response.message || "Thêm sách thất bại.";
                }
            } catch (error) {
                console.error("Create book error:", error);
                this.errorMessage = error.response?.data?.message || "Đã có lỗi xảy ra khi tạo sách mới.";
            } finally {
                this.loading = false;
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
                <h3 class="font-weight-bold mb-0">Thêm sách mới</h3>
                <p class="text-muted small mb-0">Nhập thông tin chi tiết về đầu sách</p>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </div>

        <div class="card shadow-sm" style="max-width: 800px;">
            <div class="card-body p-4">
                <form @submit.prevent="handleSubmit">
                    <div class="row">
                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Mã sách <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.bookId" 
                                type="text" 
                                class="form-control" 
                                placeholder="Ví dụ: B001" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Tên sách <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.title" 
                                type="text" 
                                class="form-control" 
                                placeholder="Nhập tên sách" 
                                required 
                            />
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="font-weight-semibold">Tác giả <span class="text-danger">*</span></label>
                            <input 
                                v-model.trim="formData.author" 
                                type="text" 
                                class="form-control" 
                                placeholder="Tên tác giả" 
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
                                placeholder="Nhập mã nhà xuất bản (ví dụ: NXB01)" 
                                required 
                            />
                        </div>

                        <div class="col-md-4 form-group">
                            <label class="font-weight-semibold">Năm xuất bản <span class="text-danger">*</span></label>
                            <input 
                                v-model.number="formData.publicationYear" 
                                type="number" 
                                min="1900" 
                                max="2099" 
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
                        <button type="submit" class="btn btn-primary font-weight-semibold" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm mr-1"></span>
                            <i v-else class="fas fa-save mr-1"></i> Lưu đầu sách
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
