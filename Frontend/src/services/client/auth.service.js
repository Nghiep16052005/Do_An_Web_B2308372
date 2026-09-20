import createApiClient from "../api.service";

class ClientAuthService {
    constructor() {
        this.api = createApiClient("/api/client/auth");
    }

    async login(credentials) {
        const response = await this.api.post("/login", credentials);
        if (response.data && response.data.success && response.data.data) {
            this.setReader(response.data.data);
        }
        return response.data;
    }

    async logout() {
        try {
            const response = await this.api.post("/logout");
            this.clearReader();
            return response.data;
        } catch (error) {
            this.clearReader();
            throw error;
        }
    }

    setReader(reader) {
        localStorage.setItem("client_user", JSON.stringify(reader));
    }

    getCurrentReader() {
        const stored = localStorage.getItem("client_user");
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    clearReader() {
        localStorage.removeItem("client_user");
    }

    isLoggedIn() {
        return !!this.getCurrentReader();
    }
}

export default new ClientAuthService();
