import createApiClient from "../api.service";

class ClientPenaltyService {
    constructor() {
        this.api = createApiClient("/api/client/penalties");
    }

    async getMyPenalties() {
        const response = await this.api.get("/my-penalties");
        return response.data;
    }

    async getDamageEstimate() {
        const response = await this.api.get("/damage-estimate");
        return response.data;
    }

    async reportLostBook(data) {
        const response = await this.api.post("/report-lost", data);
        return response.data;
    }

    async reportDamagedBook(data) {
        const response = await this.api.post("/report-damaged", data);
        return response.data;
    }

    async payPenalty(penaltyId) {
        const response = await this.api.put(`/${penaltyId}/pay`);
        return response.data;
    }

    async confirmQrPayment(penaltyId, paymentNote = "") {
        const response = await this.api.post(`/${penaltyId}/confirm-payment`, { paymentNote });
        return response.data;
    }

    async notifyFoundBook(penaltyId) {
        const response = await this.api.post("/notify-found-book", { penaltyId });
        return response.data;
    }
}

export default new ClientPenaltyService();
