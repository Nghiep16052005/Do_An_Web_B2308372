const Cart = require("../../models/cart.model");
const User = require("../../models/user.model");

module.exports.cart = async (req, res, next) => {

    let cartCount = 0;

    //--------------------------------
    // Chưa đăng nhập
    //--------------------------------

    if (!req.cookies.tokenUser) {

        const cart = req.cookies.cart || [];

        cart.forEach(item => {
            cartCount += item.quantity;
        });

        res.locals.cartCount = cartCount;

        return next();
    }

    //--------------------------------
    // Đã đăng nhập
    //--------------------------------

    const user = await User.findOne({
        token: req.cookies.tokenUser,
        deleted: false
    });

    if (!user) {

        res.locals.cartCount = 0;

        return next();
    }

    const cart = await Cart.findOne({
        user_id: user._id.toString()
    });

    if (!cart) {

        res.locals.cartCount = 0;

        return next();
    }

    cart.products.forEach(item => {
        cartCount += item.quantity;
    });

    res.locals.cartCount = cartCount;

    next();
};