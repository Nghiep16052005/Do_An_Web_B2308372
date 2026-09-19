document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // LẤY BADGE THÔNG BÁO
    // ==========================================

    const notificationBadge =
        document.getElementById("notification-badge");

    let currentNotificationCount = Number(
        notificationBadge?.dataset?.count || 0
    );

    function setNotificationBadge(count) {

        const safeCount = Math.max(0, Number(count) || 0);
        currentNotificationCount = safeCount;

        if (!notificationBadge) {
            return;
        }

        if (safeCount <= 0) {
            notificationBadge.dataset.count = "0";
            notificationBadge.style.display = "none";
            notificationBadge.textContent = "0";
            return;
        }

        notificationBadge.dataset.count = String(safeCount);
        notificationBadge.style.display = "inline-block";
        notificationBadge.textContent = safeCount > 99 ? "99+" : String(safeCount);
        notificationBadge.setAttribute("title", `${safeCount} thông báo mới`);
    }

    // ==========================================
    // CẬP NHẬT SỐ THÔNG BÁO CHƯA ĐỌC
    // ==========================================

    async function updateNotificationCount() {

        if (!notificationBadge) {
            return;
        }

        try {

            const response =
                await fetch("/notifications/unread-count", {
                    method: "GET",
                    credentials: "same-origin"
                });

            if (!response.ok) {
                setNotificationBadge(0);
                return;
            }

            const data = await response.json();
            const count = Number(data?.count || 0);

            setNotificationBadge(count);

        } catch (error) {

            console.error("Lỗi lấy số thông báo:", error);
            setNotificationBadge(0);

        }

    }


    // ==========================================
    // CHẠY NGAY KHI LOAD TRANG
    // ==========================================

    setNotificationBadge(currentNotificationCount);
    updateNotificationCount();


    // ==========================================
    // KIỂM TRA LẠI MỖI 15 GIÂY
    // ==========================================

    setInterval(
        updateNotificationCount,
        15000
    );


    // ==========================================
    // ĐÁNH DẤU THÔNG BÁO ĐÃ ĐỌC
    // ==========================================

    const notificationItems =
        document.querySelectorAll(
            ".notification-item"
        );


    notificationItems.forEach(item => {

        item.addEventListener(
            "click",
            async function () {

                const notificationId =
                    this.dataset.id;


                if (!notificationId) {
                    return;
                }

                const nextCount = Math.max(0, currentNotificationCount - 1);
                setNotificationBadge(nextCount);

                try {

                    const response = await fetch(
                        `/notifications/read/${notificationId}`,
                        {
                            method: "POST",
                            credentials: "same-origin",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );

                    if (!response.ok) {
                        updateNotificationCount();
                    }

                } catch (error) {

                    console.error(
                        "Lỗi đánh dấu thông báo:",
                        error
                    );
                    updateNotificationCount();

                }

            }
        );

    });

});