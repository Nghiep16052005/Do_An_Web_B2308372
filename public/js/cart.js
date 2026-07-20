// ======================================
// Tăng số lượng
// ======================================
console.log("cart.js loaded");
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

        fetch(`/cart/update/${productId}/${quantity}`, {
            method: "PATCH"
        })
        .then(() => {
            location.reload();
        });

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

        fetch(`/cart/update/${productId}/${quantity}`, {
            method: "PATCH"
        })
        .then(() => {
            location.reload();
        });

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

        fetch(`/cart/update/${productId}/${quantity}`, {
            method: "PATCH"
        })
        .then(() => {
            location.reload();
        });

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

        fetch(`/cart/delete/${productId}`, {
            method: "DELETE"
        })
        .then(() => {
            location.reload();
        });

    });

});