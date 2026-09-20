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

export default createApiClient;