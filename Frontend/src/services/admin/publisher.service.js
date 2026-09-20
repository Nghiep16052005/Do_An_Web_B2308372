import createApiClient from "../api.service";

class AdminPublisherService {
    constructor() {
        this.api = createApiClient("/api/admin/publishers");
    }

    async getAllPublishers() {
        const response = await this.api.get("/");
        return response.data;
    }

    async getPublisherById(id) {
        const response = await this.api.get(`/${id}`);
        return response.data;
    }

    async createPublisher(data) {
        const response = await this.api.post("/", data);
        return response.data;
    }

    async updatePublisher(id, data) {
        const response = await this.api.put(`/${id}`, data);
        return response.data;
    }

    async deletePublisher(id) {
        const response = await this.api.delete(`/${id}`);
        return response.data;
    }
}

export default new AdminPublisherService();
