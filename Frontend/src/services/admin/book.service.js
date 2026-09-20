import createApiClient from "../api.service";

class AdminBookService {
    constructor() {
        this.api = createApiClient("/api/admin/books");
    }

    async getAllBooks() {
        const response = await this.api.get("/");
        return response.data;
    }

    async getBookById(id) {
        const response = await this.api.get(`/${id}`);
        return response.data;
    }

    async createBook(data) {
        const response = await this.api.post("/", data);
        return response.data;
    }

    async updateBook(id, data) {
        const response = await this.api.put(`/${id}`, data);
        return response.data;
    }

    async deleteBook(id) {
        const response = await this.api.delete(`/${id}`);
        return response.data;
    }
}

export default new AdminBookService();