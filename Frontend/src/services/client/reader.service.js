import createApiClient from "../api.service";

class ClientReaderService {
    constructor() {
        this.api = createApiClient("/api/client/readers");
    }

    async getProfile() {
        const response = await this.api.get("/profile");
        return response.data;
    }

    async updateProfile(data) {
        const response = await this.api.put("/profile", data);
        return response.data;
    }
}

export default new ClientReaderService();
