import createApiClient from "../api.service";

class ClientBorrowRecordService {
    constructor() {
        this.api = createApiClient("/api/client/borrow-records");
    }

    async getMyBorrowRecords() {
        const response = await this.api.get("/");
        return response.data;
    }

    async borrowBook(data) {
        const response = await this.api.post("/", data);
        return response.data;
    }

    async returnBook(recordId) {
        const response = await this.api.put(`/${recordId}/return`);
        return response.data;
    }
}

export default new ClientBorrowRecordService();
