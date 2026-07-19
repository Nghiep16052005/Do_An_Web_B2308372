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

    res.send("Thêm vào giỏ hàng");

} 

