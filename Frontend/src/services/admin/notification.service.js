import createApiClient from "../api.service";

class AdminNotificationService {
    constructor() {
        this.api = createApiClient("/api/admin/notifications");
    }

    async getNotifications() {
        try {
            const response = await this.api.get("/");
            return response.data;
        } catch {
            return {
                success: false,
                data: [],
                unreadCount: 0
            };
        }
    }

    async markAllAsRead() {
        try {
            const response = await this.api.put("/mark-read");
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Không thể cập nhật trạng thái đã đọc."
            };
        }
    }
}

export default new AdminNotificationService();
