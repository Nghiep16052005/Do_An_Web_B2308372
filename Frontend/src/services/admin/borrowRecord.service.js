import createApiClient from "../api.service";

class AdminBorrowRecordService {
    constructor() {
        this.api = createApiClient("/api/admin/borrow-records");
    }

    async getAllBorrowRecords() {
        try {
            const response = await this.api.get("/");
            return response.data;
        } catch {
            return {
                success: true,
                data: []
            };
        }
    }

    async getBorrowRecordById(id) {
        try {
            const response = await this.api.get(`/${id}`);
            return response.data;
        } catch {
            return {
                success: false,
                message: "Không tìm thấy thông tin phiếu mượn."
            };
        }
    }

    async updateStatus(id, status) {
        try {
            const response = await this.api.put(`/${id}/status`, { status });
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Không thể cập nhật trạng thái phiếu mượn."
            };
        }
    }
}

export default new AdminBorrowRecordService();
