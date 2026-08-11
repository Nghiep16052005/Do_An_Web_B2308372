const User = require("../../models/user.model");
const Cart = require("../../models/cart.model");
const Notification = require("../../models/notification.model");

module.exports.infoUser = async (req, res, next) => {

    console.log("Cookie:", req.cookies);

    // Mặc định
    res.locals.user = null;
    res.locals.cartCount = 0;
    res.locals.unreadNotificationCount = 0;

    //--------------------------------
    // Chưa đăng nhập
    //--------------------------------

    if (!req.cookies.tokenUser) {

        const cart = req.cookies.cart || [];

        let count = 0;

        cart.forEach(item => {
            count += item.quantity;
        });

        res.locals.cartCount = count;

        return next();
    }

    //--------------------------------
    // Đã đăng nhập
    //--------------------------------

    const user = await User.findOne({
        token: req.cookies.tokenUser,
        deleted: false
    });

    console.log("User:", user);

    if (!user) {
        return next();
    }

    res.locals.user = user;

    res.locals.unreadNotificationCount = await Notification.countDocuments({
        user_id: user._id.toString(),
        isRead: false
    });

    //--------------------------------
    // Lấy giỏ hàng
    //--------------------------------

    const cart = await Cart.findOne({
        user_id: user._id.toString()
    });

    if (!cart) {
        return next();
    }

    let count = 0;

    cart.products.forEach(item => {
        count += item.quantity;
    });

    res.locals.cartCount = count;

    next();

}