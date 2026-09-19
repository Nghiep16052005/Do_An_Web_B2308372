// ======================================
// Tăng số lượng
// ======================================
console.log("cart.js loaded");

function updateHeaderCartCount() {

    const countEl = document.getElementById("header-cart-count");

    if (!countEl) return;

    fetch("/cart/count")
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    `HTTP error: ${response.status}`
                );
            }

            return response.json();
        })
        .then(data => {

            console.log("Cart count:", data);

            if (data.success) {

                countEl.textContent = data.count;

            } else {

                countEl.textContent = 0;

            }

        })
        .catch(error => {

            console.error(
                "Không thể lấy số lượng giỏ hàng:",
                error
            );

            countEl.textContent = 0;
        });
}

function showCartToast(message) {
    let toast = document.getElementById("cart-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "cart-toast";
        toast.className = "cart-toast";
        document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="fa-solid fa-check"></i> ${message}`;
    toast.classList.add("show");

    clearTimeout(showCartToast.timeout);
    showCartToast.timeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

function showCartLoading() {
    let overlay = document.getElementById("cart-loading-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "cart-loading-overlay";
        overlay.className = "cart-loading-overlay";
        overlay.innerHTML = `
            <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    overlay.style.display = "flex";
}

function pulseButton(button) {
    button.classList.add('btn-animate');
    setTimeout(() => button.classList.remove('btn-animate'), 240);
}
function handleCartAction(request, button) {

    showCartLoading();

    if (button) {
        pulseButton(button);
    }

    request()
        .then(response => response.json())
        .then(data => {

            if (!data.success) {

                const overlay = document.getElementById("cart-loading-overlay");

                if (overlay) {
                    overlay.style.display = "none";
                }

                return;
            }

            setTimeout(() => {
                location.reload();
            }, 180);

        })
        .catch(error => {

            console.log(error);

            const overlay = document.getElementById("cart-loading-overlay");

            if (overlay) {
                overlay.style.display = "none";
            }

        });

}

const buttonsPlus = document.querySelectorAll(".btn-plus");

buttonsPlus.forEach(button => {

    button.addEventListener("click", () => {

        const productId = button.dataset.productId;

        const input = document.querySelector(
            `.quantity-input[data-product-id="${productId}"]`
        );

        let quantity = Number(input.value);

        const stock = Number(input.dataset.stock);

        if (quantity < stock) {
            quantity++;
        }

        handleCartAction(() => fetch(`/cart/update/${productId}/${quantity}`, {
            method: "PATCH"
        }), button);
        setTimeout(updateHeaderCartCount, 120);

    });

});


// ======================================
// Giảm số lượng
// ======================================

const buttonsMinus = document.querySelectorAll(".btn-minus");

buttonsMinus.forEach(button => {

    button.addEventListener("click", () => {

        const productId = button.dataset.productId;

        const input = document.querySelector(
            `.quantity-input[data-product-id="${productId}"]`
        );

        let quantity = Number(input.value);

        if (quantity > 1) {
            quantity--;
        }

        handleCartAction(() => fetch(`/cart/update/${productId}/${quantity}`, {
            method: "PATCH"
        }), button);
        setTimeout(updateHeaderCartCount, 120);

    });

});


// ======================================
// Nhập trực tiếp số lượng
// ======================================

const quantityInputs = document.querySelectorAll(".quantity-input");

quantityInputs.forEach(input => {

    input.addEventListener("change", () => {

        const productId = input.dataset.productId;

        let quantity = Number(input.value);

        const stock = Number(input.dataset.stock);

        if (quantity < 1) {
            quantity = 1;
        }

        if (quantity > stock) {
            quantity = stock;
        }

        handleCartAction(() => fetch(`/cart/update/${productId}/${quantity}`, {
            method: "PATCH"
        }), input);
        setTimeout(updateHeaderCartCount, 120);

    });

});


// ======================================
// Xóa sản phẩm
// ======================================

const buttonsDelete = document.querySelectorAll(".btn-delete");

buttonsDelete.forEach(button => {

    button.addEventListener("click", () => {

        const productId = button.dataset.productId;

        if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
            return;
        }

        handleCartAction(() => fetch(`/cart/delete/${productId}`, {
            method: "DELETE"
        }), button);
        setTimeout(updateHeaderCartCount, 120);

    });

});
// ======================================
// Thêm sản phẩm vào giỏ hàng
// ======================================

const addToCartForms = document.querySelectorAll(".add-to-cart-form");

console.log("Số form thêm giỏ hàng:", addToCartForms.length);

addToCartForms.forEach(form => {

    form.addEventListener("submit", async (event) => {

        // Không cho form submit trực tiếp
        event.preventDefault();

        console.log("Đã bắt sự kiện submit");

        const button = form.querySelector(
            'button[type="submit"]'
        );

        if (!button) {
            console.log("Không tìm thấy button");
            return;
        }

        const productId = button.dataset.productId;

        console.log("Product ID:", productId);

        if (!productId) {
            console.log("Không có productId");
            return;
        }

        try {

            console.log(
                "Đang gửi POST:",
                `/cart/add/${productId}`
            );

            const response = await fetch(
                `/cart/add/${productId}`,
                {
                    method: "POST"
                }
            );

            console.log(
                "HTTP status:",
                response.status
            );

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const data = await response.json();

            console.log(
                "Server trả về:",
                data
            );

            if (data.success) {

                showCartToast(
                    "Đã thêm vào giỏ hàng"
                );

                // Refresh trang sau 500ms
                setTimeout(() => {

                    window.location.reload();

                }, 500);

            }

        } catch (error) {

            console.error(
                "Lỗi thêm vào giỏ hàng:",
                error
            );

        }

    });

});

updateHeaderCartCount();