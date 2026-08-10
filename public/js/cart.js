// ======================================
// Tăng số lượng
// ======================================
console.log("cart.js loaded");

function updateHeaderCartCount() {
    const countEl = document.getElementById("header-cart-count");
    if (!countEl) return;

    const inputs = document.querySelectorAll('.quantity-input');
    let total = 0;

    inputs.forEach(input => {
        const value = Number(input.value);
        if (!isNaN(value) && value > 0) {
            total += value;
        }
    });

    countEl.textContent = total > 0 ? total : 0;
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
const addToCartForms = document.querySelectorAll(".add-to-cart-form");

addToCartForms.forEach(form => {

    form.addEventListener("submit", (event) => {

        event.preventDefault();

        const button = form.querySelector('button[type="submit"]');
        const productId = button?.dataset.productId;

        if (!productId) {
            return;
        }

        fetch(`/cart/add/${productId}`, {
            method: "POST"
        })
        .then(response => response.json())
        .then(data => {

            if (!data.success) {
                return;
            }

            showCartToast("Đã thêm vào giỏ hàng");

            setTimeout(() => {
                window.location.reload();
            }, 450);

        })
        .catch(error => {
            console.log(error);
        });

    });

});

updateHeaderCartCount();