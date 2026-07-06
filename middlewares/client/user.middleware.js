const User = require("../../models/user.model");

module.exports.infoUser = async (req, res, next) => {

    console.log("Cookie:", req.cookies);

    if(req.cookies.tokenUser){

        const user = await User.findOne({
            token: req.cookies.tokenUser
        });

        console.log("User:", user);

        if(user){
            res.locals.user = user;
        }
    }

    next();
}