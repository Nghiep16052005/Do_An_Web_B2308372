import createApiClient from "../api.service";

class AdminReaderService {
    constructor() {
        this.api = createApiClient("/api/admin/readers");
    }

    async getAllReaders() {
        const response = await this.api.get("/");
        return response.data;
    }

    async getReaderById(id) {
        const response = await this.api.get(`/${id}`);
        return response.data;
    }

    async createReader(data) {
        const response = await this.api.post("/", data);
        return response.data;
    }

    async updateReader(id, data) {
        const response = await this.api.put(`/${id}`, data);
        return response.data;
    }

    async deleteReader(id) {
        const response = await this.api.delete(`/${id}`);
        return response.data;
    }
}

export default new AdminReaderService();
