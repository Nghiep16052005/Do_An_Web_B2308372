<script>
import AdminNotificationService from "@/services/admin/notification.service";
import ClientNotificationService from "@/services/client/notification.service";

export default {
    name: "NotificationDropdown",

    props: {
        role: {
            type: String,
            default: "client" // "admin" or "client"
        },
        readerId: {
            type: String,
            default: ""
        }
    },

    data() {
        return {
            isOpen: false,
            notifications: [],
            unreadCount: 0,
            eventSource: null,
            loading: false,
            isRinging: false,
            toast: null,
            toastTimeout: null
        };
    },

    computed: {
        service() {
            return this.role === "admin" ? AdminNotificationService : ClientNotificationService;
        }
    },

    watch: {
        readerId(newVal, oldVal) {
            if (newVal !== oldVal) {
                if (this.eventSource) {
                    this.eventSource.close();
                }
                this.fetchNotifications();
                this.initSSE();
            }
        }
    },

    mounted() {
        this.fetchNotifications();
        this.initSSE();
        document.addEventListener("click", this.handleClickOutside);
        window.addEventListener("notification-updated", this.handleExternalUpdate);
        window.addEventListener("borrow-record-updated", this.handleExternalUpdate);
        window.addEventListener("reader-auth-change", this.handleReaderAuthChange);
    },

    beforeUnmount() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        document.removeEventListener("click", this.handleClickOutside);
        window.removeEventListener("notification-updated", this.handleExternalUpdate);
        window.removeEventListener("borrow-record-updated", this.handleExternalUpdate);
        window.removeEventListener("reader-auth-change", this.handleReaderAuthChange);
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
    },

    methods: {
        handleReaderAuthChange() {
            if (this.eventSource) {
                this.eventSource.close();
            }
            this.fetchNotifications();
            this.initSSE();
        },

        async handleExternalUpdate() {
            await this.fetchNotifications();
            this.triggerBellAnimation();
        },

        async fetchNotifications() {
            this.loading = true;
            try {
                const response = await this.service.getNotifications();
                if (response.success) {
                    this.notifications = response.data || [];
                    this.unreadCount = response.unreadCount || 0;
                }
            } catch (err) {
                console.error("Fetch notifications error:", err);
            } finally {
                this.loading = false;
            }
        },

        initSSE() {
            let url = `/api/notifications/stream?role=${this.role}`;
            if (this.readerId) {
                url += `&readerId=${this.readerId}`;
            }

            try {
                this.eventSource = new EventSource(url);

                this.eventSource.addEventListener("NOTIFICATION", (e) => {
                    try {
                        const notif = JSON.parse(e.data);
                        this.notifications.unshift(notif);
                        this.unreadCount += 1;
                        this.triggerBellAnimation();
                        this.showToast(notif);
                        this.playNotificationSound();
                    } catch (err) {
                        console.error("Parse notification error:", err);
                    }
                });

                this.eventSource.addEventListener("NEW_BORROW", (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        window.dispatchEvent(new CustomEvent("new-borrow-record", { detail: data }));
                    } catch (err) {
                        console.error("SSE new borrow error:", err);
                    }
                });

                this.eventSource.addEventListener("BORROW_RECORD_UPDATED", (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        window.dispatchEvent(new CustomEvent("borrow-record-updated", { detail: data }));
                    } catch (err) {
                        console.error("SSE borrow record updated error:", err);
                    }
                });

                this.eventSource.addEventListener("BOOK_QUANTITY_UPDATED", (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        window.dispatchEvent(new CustomEvent("book-quantity-updated", { detail: data }));
                    } catch (err) {
                        console.error("SSE book quantity updated error:", err);
                    }
                });

                this.eventSource.onerror = () => {
                    // EventSource will automatically retry in modern browsers
                };
            } catch (err) {
                console.error("Init SSE error:", err);
            }
        },

        triggerBellAnimation() {
            this.isRinging = true;
            setTimeout(() => {
                this.isRinging = false;
            }, 1200);
        },

        showToast(notif) {
            this.toast = notif;
            if (this.toastTimeout) {
                clearTimeout(this.toastTimeout);
            }
            this.toastTimeout = setTimeout(() => {
                this.toast = null;
            }, 6000);
        },

        playNotificationSound() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = "sine";
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

                osc.start();
                osc.stop(ctx.currentTime + 0.35);
            } catch (err) {
                // Audio context may be restricted by browser policy before user interaction
            }
        },

        toggleDropdown() {
            this.isOpen = !this.isOpen;
        },

        handleClickOutside(event) {
            if (this.$el && !this.$el.contains(event.target)) {
                this.isOpen = false;
            }
        },

        async handleMarkAllAsRead() {
            try {
                await this.service.markAllAsRead();
                this.unreadCount = 0;
                this.notifications.forEach(n => { n.isRead = true; });
            } catch (err) {
                console.error("Mark read error:", err);
            }
        },

        formatTime(dateStr) {
            if (!dateStr) return "";
            const date = new Date(dateStr);
            const now = new Date();
            const diffSeconds = Math.floor((now - date) / 1000);

            if (diffSeconds < 60) return "Vừa xong";
            if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
            if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
            return date.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            });
        }
    }
};
</script>

<template>
    <div class="notification-dropdown position-relative mr-3">
        <!-- Bell button -->
        <button 
            type="button" 
            class="btn btn-light rounded-circle shadow-sm position-relative d-flex align-items-center justify-content-center border bell-btn"
            style="width: 40px; height: 40px; padding: 0; background: #fff;"
            title="Chuông thông báo"
            @click="toggleDropdown"
        >
            <i 
                class="fas fa-bell" 
                :class="{ 'bell-ringing text-primary': isRinging, 'text-primary': unreadCount > 0, 'text-secondary': unreadCount === 0 }"
                style="font-size: 1.15rem;"
            ></i>
            
            <!-- Red Badge with number (ví dụ: chuông số 1) -->
            <span 
                v-if="unreadCount > 0" 
                class="badge badge-danger position-absolute badge-pulse"
                style="top: -4px; right: -4px; font-size: 0.72rem; padding: 3px 6px; border-radius: 10px; border: 2px solid #fff; font-weight: 700;"
            >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
        </button>

        <!-- Dropdown Menu -->
        <div 
            v-if="isOpen" 
            class="card shadow-lg position-absolute notification-panel"
            style="top: 48px; right: 0; width: 350px; max-width: 90vw; z-index: 1050; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;"
        >
            <div class="card-header bg-white d-flex justify-content-between align-items-center py-2 px-3 border-bottom">
                <div class="d-flex align-items-center">
                    <span class="font-weight-bold text-dark" style="font-size: 0.95rem;">
                        <i class="fas fa-bell text-primary mr-1"></i> Thông báo
                    </span>
                    <span v-if="unreadCount > 0" class="badge badge-danger ml-2 px-2 py-1">
                        {{ unreadCount }} chưa đọc
                    </span>
                </div>
                <button 
                    v-if="unreadCount > 0" 
                    type="button" 
                    class="btn btn-link btn-sm p-0 text-decoration-none text-primary small"
                    style="font-size: 0.78rem;"
                    @click="handleMarkAllAsRead"
                >
                    Đã đọc tất cả
                </button>
            </div>

            <!-- List -->
            <div class="notification-list" style="max-height: 380px; overflow-y: auto;">
                <div v-if="loading && notifications.length === 0" class="text-center py-4 text-muted">
                    <div class="spinner-border spinner-border-sm text-primary"></div>
                    <div class="small mt-1">Đang tải thông báo...</div>
                </div>

                <div v-else-if="notifications.length === 0" class="text-center py-5 text-muted">
                    <i class="far fa-bell-slash fa-2x mb-2 text-muted" style="opacity: 0.4;"></i>
                    <div class="small">Hiện chưa có thông báo nào</div>
                </div>

                <div 
                    v-else 
                    v-for="item in notifications" 
                    :key="item._id"
                    :class="['p-3 border-bottom notification-item', { 'bg-light-blue': !item.isRead }]"
                    style="transition: background 0.15s ease;"
                >
                    <div class="d-flex align-items-start">
                        <div class="mr-2 mt-1">
                            <span 
                                v-if="item.type === 'BORROW'" 
                                class="badge badge-primary rounded-circle p-2"
                                title="Mượn sách"
                            >
                                <i class="fas fa-book"></i>
                            </span>
                            <span 
                                v-else-if="item.type === 'RETURN'" 
                                class="badge badge-success rounded-circle p-2"
                                title="Trả sách"
                            >
                                <i class="fas fa-undo"></i>
                            </span>
                            <span 
                                v-else 
                                class="badge badge-info rounded-circle p-2"
                            >
                                <i class="fas fa-info"></i>
                            </span>
                        </div>
                        <div class="flex-grow-1 ml-1">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <strong class="text-dark small" style="font-size: 0.85rem;">
                                    {{ item.title }}
                                </strong>
                                <span class="text-muted" style="font-size: 0.7rem;">
                                    {{ formatTime(item.createdAt) }}
                                </span>
                            </div>
                            <p class="text-muted mb-0 small" style="font-size: 0.8rem; line-height: 1.35;">
                                {{ item.message }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Floating Toast Notification on Screen -->
        <transition name="toast-slide">
            <div 
                v-if="toast" 
                class="floating-toast shadow-lg d-flex align-items-start p-3 bg-white border"
                @click="toast = null"
            >
                <div class="mr-3 text-primary" style="font-size: 1.4rem;">
                    <span v-if="toast.type === 'RETURN'" class="badge badge-success rounded-circle p-2">
                        <i class="fas fa-undo"></i>
                    </span>
                    <span v-else-if="toast.type === 'BORROW'" class="badge badge-primary rounded-circle p-2">
                        <i class="fas fa-book"></i>
                    </span>
                    <span v-else class="badge badge-info rounded-circle p-2">
                        <i class="fas fa-bell"></i>
                    </span>
                </div>
                <div class="flex-grow-1 pr-2">
                    <div class="font-weight-bold text-dark" style="font-size: 0.9rem;">
                        {{ toast.title }}
                    </div>
                    <div class="text-muted small mt-1" style="font-size: 0.82rem; line-height: 1.35;">
                        {{ toast.message }}
                    </div>
                </div>
                <button type="button" class="close ml-1 text-muted" style="font-size: 1.1rem;" @click.stop="toast = null">&times;</button>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.bg-light-blue {
    background-color: #f0f7ff;
}

.notification-item:hover {
    background-color: #f8fafc;
}

.notification-panel {
    animation: fadeInDown 0.2s ease-out;
}

@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Bell ring animation */
.bell-ringing {
    animation: ring 0.6s ease-in-out infinite;
    transform-origin: 50% 0%;
}

@keyframes ring {
    0% { transform: rotate(0); }
    15% { transform: rotate(15deg); }
    30% { transform: rotate(-15deg); }
    45% { transform: rotate(10deg); }
    60% { transform: rotate(-10deg); }
    75% { transform: rotate(4deg); }
    85% { transform: rotate(-4deg); }
    100% { transform: rotate(0); }
}

.badge-pulse {
    animation: pulse 1.8s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
    }
    70% {
        transform: scale(1.08);
        box-shadow: 0 0 0 6px rgba(220, 53, 69, 0);
    }
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
    }
}

/* Floating Toast */
.floating-toast {
    position: fixed;
    top: 75px;
    right: 20px;
    z-index: 9999;
    border-radius: 12px;
    max-width: 380px;
    border-left: 5px solid #10b981 !important;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    background: #ffffff;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from {
    opacity: 0;
    transform: translateX(40px);
}

.toast-slide-leave-to {
    opacity: 0;
    transform: translateX(40px);
}
</style>
