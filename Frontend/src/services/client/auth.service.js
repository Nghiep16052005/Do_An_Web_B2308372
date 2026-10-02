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
        window.dispatchEvent(new CustomEvent("reader-auth-change", { detail: reader }));
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
        window.dispatchEvent(new CustomEvent("reader-auth-change", { detail: null }));
    }

    isLoggedIn() {
        return !!this.getCurrentReader();
    }

    saveCredentials(readerId, phoneNumber, remember = true) {
        if (remember) {
            localStorage.setItem("saved_reader_id", readerId);
            localStorage.setItem("saved_reader_phone", phoneNumber);
            localStorage.setItem("remember_reader", "true");
        } else {
            localStorage.removeItem("saved_reader_id");
            localStorage.removeItem("saved_reader_phone");
            localStorage.removeItem("remember_reader");
        }
    }

    getSavedCredentials() {
        const readerId = localStorage.getItem("saved_reader_id") || "";
        const phoneNumber = localStorage.getItem("saved_reader_phone") || "";
        const remember = localStorage.getItem("remember_reader") === "true";
        return { readerId, phoneNumber, remember };
    }
}

export default new ClientAuthService();
