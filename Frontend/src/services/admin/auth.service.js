import createApiClient from "../api.service";

class AdminAuthService {
    constructor() {
        this.api = createApiClient("/api/admin/auth");
    }

    async login(credentials) {
        const response = await this.api.post("/login", credentials);
        if (response.data && response.data.success && response.data.data) {
            this.setEmployee(response.data.data);
        }
        return response.data;
    }

    async logout() {
        try {
            const response = await this.api.post("/logout");
            this.clearEmployee();
            return response.data;
        } catch (error) {
            this.clearEmployee();
            throw error;
        }
    }

    setEmployee(employee) {
        localStorage.setItem("admin_user", JSON.stringify(employee));
    }

    getCurrentEmployee() {
        const stored = localStorage.getItem("admin_user");
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    clearEmployee() {
        localStorage.removeItem("admin_user");
    }

    isLoggedIn() {
        return !!this.getCurrentEmployee();
    }
}

export default new AdminAuthService();
