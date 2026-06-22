const User = require("../../models/user.model");

module.exports.requireAuth = async (req,res,next)=>{

    const token = req.cookies.tokenUser;

    if(!token){
        return res.redirect("/account/login");
    }

    const user = await User.findOne({
        token: token
    });

    if(!user){
        return res.redirect("/account/login");
    }

    res.locals.user = user;

    next();
}