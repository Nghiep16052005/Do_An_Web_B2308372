import createApiClient from "../api.service";

class AdminPenaltyService {
    constructor() {
        this.api = createApiClient("/api/admin/penalties");
    }

    async getAllPenalties() {
        const response = await this.api.get("/");
        return response.data;
    }

    async createPenalty(data) {
        const response = await this.api.post("/", data);
        return response.data;
    }

    async updateStatus(penaltyId, status) {
        const response = await this.api.put(`/${penaltyId}/status`, { status });
        return response.data;
    }

    async approvePayment(penaltyId) {
        const response = await this.api.put(`/${penaltyId}/approve-payment`);
        return response.data;
    }

    async rejectPayment(penaltyId, reason = "") {
        const response = await this.api.put(`/${penaltyId}/reject-payment`, { reason });
        return response.data;
    }

    async returnFoundBook(payload) {
        const response = await this.api.post("/return-found-book", payload);
        return response.data;
    }
}

export default new AdminPenaltyService();
