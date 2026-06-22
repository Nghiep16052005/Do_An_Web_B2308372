const User = require("../../models/user.model");

module.exports.infoUser = async (req, res, next) => {

    if(req.cookies.tokenUser){

        const user = await User.findOne({
            token: req.cookies.tokenUser
        });

        if(user){
            res.locals.user = user;
        }
    }

    next();
}