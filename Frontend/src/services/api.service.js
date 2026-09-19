import axios from "axios";

const createApiClient = (baseURL) => {
    return axios.create({
        baseURL: baseURL,

        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },

        withCredentials: true
    });
};

const BASE_URL = "http://localhost:3000";

export const bookService = {
    list() {
        return createApiClient(BASE_URL).get("/api/books");
    }
};