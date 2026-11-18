import axios from "axios";

const createApiClient = (baseURL) => {
    const client = axios.create({
        baseURL: baseURL,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        withCredentials: true
    });

    client.interceptors.response.use(
        (response) => response,
        (error) => {
            // Khi phiên đăng nhập hết hạn hoặc chưa đăng nhập
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                const isCurrentAdmin = window.location.pathname.startsWith("/admin");
                if (isCurrentAdmin && !window.location.pathname.includes("/admin/login")) {
                    console.warn("Phiên đăng nhập quản trị đã hết hạn hoặc không hợp lệ. Đang chuyển hướng về trang đăng nhập...");
                    localStorage.removeItem("admin_user");
                    window.location.href = `/admin/login?expired=1&redirect=${encodeURIComponent(window.location.pathname)}`;
                }
            }
            return Promise.reject(error);
        }
    );

    return client;
};

export default createApiClient;