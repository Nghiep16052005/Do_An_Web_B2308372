//console.log(User);
const bcrypt = require("bcryptjs");
const randomString = require("randomstring");
const User = require("../../models/user.model");
const md5 = require("md5"); 

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
        res.cookie(
        "tokenUser",
        token
    );
    res.redirect("/");
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

    res.cookie(
        "tokenUser",
        user.token
    );

    res.redirect("/");

}

// dang xuat 
module.exports.logout = (req, res) => {
    console.log("Đã vào logout");
    res.clearCookie("tokenUser");

    res.redirect("/");

}