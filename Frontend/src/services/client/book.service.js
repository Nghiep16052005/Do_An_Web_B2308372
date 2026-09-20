import createApiClient from "../api.service";

class ClientBookService {
    constructor() {
        this.api = createApiClient("/api/client/books");
    }

    async getAllBooks() {
        const response = await this.api.get("/");
        return response.data;
    }

    async searchBooks(keyword) {
        const response = await this.api.get("/search", {
            params: { keyword }
        });
        return response.data;
    }

    async getBookById(id) {
        const response = await this.api.get(`/${id}`);
        return response.data;
    }
}

export default new ClientBookService();
