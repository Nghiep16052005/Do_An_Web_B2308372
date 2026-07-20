const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");

// [GET] /cart
module.exports.index = async (req, res) => {

    const cart = {
        products: []
    };

    res.render("client/pages/cart/index", {
        pageTitle: "Giỏ hàng",
        cart: cart
    });

};

// [POST] /cart/add/:productId
module.exports.addPost = async (req, res) => {

    const productId = req.params.productId;

    let cart = req.cookies.cart || [];

    const index = cart.findIndex(item => item.product_id === productId);

    if (index >= 0) {

        cart[index].quantity += 1;

    } else {

        cart.push({
            product_id: productId,
            quantity: 1
        });

    }

    res.cookie("cart", cart, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    });

    res.redirect("back");

};