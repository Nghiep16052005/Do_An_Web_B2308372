const User = require("../../models/user.model");
const bcrypt = require("bcryptjs");
const md5 = require("md5"); 

// form dang ki 
module.exports.register = (req, res) => {

    res.render("client/pages/account/register", {
        pageTitle: "Đăng ký"
    });

}

// xu li dang ki 

module.exports.registerPost = async (req, res) => {

    const existEmail = await User.findOne({
        email: req.body.email
    });

    if(existEmail){
        return res.redirect("back");
    }

    const hashPassword = bcrypt.hashSync(req.body.password, 10);

    const user = new User({
        fullName: req.body.fullName,
        email: req.body.email,
        password: hashPassword,
        token: md5(Date.now())
    });

    await user.save();

    res.cookie("tokenUser", user.token);

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

    const email = req.body.email;

    const password = req.body.password;

    const user = await User.findOne({
        email: email
    });

    if(!user){
        return res.redirect("back");
    }

    const checkPassword = bcrypt.compareSync(
        password,
        user.password
    );

    if(!checkPassword){
        return res.redirect("back");
    }

    res.cookie("tokenUser", user.token);

    res.redirect("/");
} 

// dang xuat 
module.exports.logout = (req, res) => {

    res.clearCookie("tokenUser");

    res.redirect("/");

}