//console.log(User);
const bcrypt = require("bcryptjs");
const randomString = require("randomstring");
const User = require("../../models/user.model");
const md5 = require("md5"); 
const Cart = require("../../models/cart.model");
// form dang ki 
module.exports.register = (req, res) => {

    res.render("client/pages/account/register", {
        pageTitle: "Đăng ký"
    });

}

// xu li dang ki 

module.exports.registerPost = async (req, res) => {

    // Kiểm tra họ tên
    if (!req.body.fullName) {
        return res.send("Họ tên không được để trống");
    }

    // Kiểm tra email
    if (!req.body.email) {
        return res.send("Email không được để trống");
    }

    // Kiểm tra mật khẩu
    if (!req.body.password) {
        return res.send("Mật khẩu không được để trống");
    }

    // Kiểm tra độ dài mật khẩu
    if (req.body.password.length < 6) {
        return res.send("Mật khẩu phải có ít nhất 6 ký tự");
    }

    // Kiểm tra xác nhận mật khẩu
    if (req.body.password !== req.body.confirmPassword) {
        return res.send("Mật khẩu xác nhận không khớp");
    }

    // Kiểm tra email đã tồn tại
    const existEmail = await User.findOne({
        email: req.body.email
    });

    if (existEmail) {
        return res.send("Email đã tồn tại");
    }

    // ma hoa mat khau 
    const hashPassword = bcrypt.hashSync(
        req.body.password,
        10
    );
    const token = randomString.generate(30);

    // Tạo User
    const user = new User({
        fullName: req.body.fullName,
        email: req.body.email,
        password: hashPassword,
        token: token
    });

    // Lưu MongoDB
    await user.save();

    // Lưu cookie đăng nhập
    res.cookie("tokenUser", user.token);

    // Merge giỏ hàng tạm từ cookie nếu có
    const cookieCart = req.cookies.cart || [];

    if (cookieCart.length > 0) {
        let cart = await Cart.findOne({
            user_id: user._id.toString()
        });

        if (!cart) {
            cart = new Cart({
                user_id: user._id.toString(),
                products: []
            });
        }

        for (const item of cookieCart) {
            const existProduct = cart.products.find(product =>
                product.product_id == item.product_id
            );

            if (existProduct) {
                existProduct.quantity += item.quantity;
            } else {
                cart.products.push({
                    product_id: item.product_id,
                    quantity: item.quantity
                });
            }
        }

        await cart.save();
        res.clearCookie("cart");
    }

    return res.redirect("/");
}

    //form dang nhap 
    module.exports.login = (req, res) => {

        res.render("client/pages/account/login", {
            pageTitle: "Đăng nhập"
        });

    } 
// xu li dang nhap
module.exports.loginPost = async (req, res) => {

    const user = await User.findOne({
        email: req.body.email
    });

    if(!user){
        return res.send("Email không tồn tại");
    }

    const checkPassword = bcrypt.compareSync(
        req.body.password,
        user.password
    );

    if(!checkPassword){
        return res.send("Sai mật khẩu");
    }

 // Lưu cookie đăng nhập
    res.cookie(
        "tokenUser",
        user.token
    );

    //=====================================
    // Merge Cookie -> MongoDB
    //=====================================

    const cookieCart = req.cookies.cart || [];

    if(cookieCart.length > 0){

        //---------------------------------
        // Tìm cart của user
        //---------------------------------

        let cart = await Cart.findOne({

            user_id: user._id.toString()

        });

        //---------------------------------
        // Nếu chưa có cart
        //---------------------------------

        if(!cart){

            cart = new Cart({

                user_id: user._id.toString(),

                products: []

            });

        }

        //---------------------------------
        // Duyệt Cookie
        //---------------------------------

        for(const item of cookieCart){

            const existProduct = cart.products.find(product =>

                product.product_id == item.product_id

            );

            //------------------------------
            // Đã có sản phẩm
            //------------------------------

            if(existProduct){

                existProduct.quantity += item.quantity;

            }

            //------------------------------
            // Chưa có
            //------------------------------

            else{

                cart.products.push({

                    product_id: item.product_id,

                    quantity: item.quantity

                });

            }

        }

        await cart.save();

        //---------------------------------
        // Xóa Cookie sau khi Merge
        //---------------------------------

        res.clearCookie("cart");

    }

    res.redirect("/");
}
// dang xuat 
module.exports.logout = (req, res) => {
    console.log("Đã vào logout");
    res.clearCookie("tokenUser");

    res.redirect("/");

}