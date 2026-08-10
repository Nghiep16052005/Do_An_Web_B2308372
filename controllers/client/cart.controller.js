const Cart = require("../../models/cart.model"); 
const User = require("../../models/user.model");
const Product = require("../../models/product.model");

// [GET] /cart
module.exports.index = async (req, res) => {

    let cart = {
        products: []
    };

    //-------------------------------------------------
    // CHƯA ĐĂNG NHẬP -> COOKIE
    //-------------------------------------------------

    if (!req.cookies.tokenUser) {

        cart.products = req.cookies.cart || [];

    }

    //-------------------------------------------------
    // ĐÃ ĐĂNG NHẬP -> MONGODB
    //-------------------------------------------------

    else {

        const user = await User.findOne({
            token: req.cookies.tokenUser,
            deleted: false
        });

        if (user) {

            const cartDB = await Cart.findOne({
                user_id: user._id.toString()
            });

            if (cartDB) {

                cart.products = cartDB.products;

            }

        }

    }

    //-------------------------------------------------
    // Lấy thông tin từng sản phẩm
    //-------------------------------------------------

    let totalPrice = 0;

    for (const item of cart.products) {

        const product = await Product.findById(item.product_id);

        if (!product) continue;

        item.product = product;  
         // Kiểm tra số lượng không vượt quá tồn kho
        if (item.quantity > product.stock) {
            item.quantity = product.stock;
        }
        item.thumbnail = product.thumbnail; 

        item.originalPrice = product.priceOut;

        item.salePrice =
            product.salePrice > 0
                ? product.salePrice
                : product.priceOut;

        item.discount = item.originalPrice - item.salePrice; 

        item.discountPercent =
            Math.round(
                item.discount * 100 / item.originalPrice
            );

        item.totalPrice = item.salePrice * item.quantity;

        totalPrice += item.totalPrice;

    }

    cart.totalPrice = totalPrice;

    res.render("client/pages/cart/index", {

        pageTitle: "Giỏ hàng",

        cart

    });

};

// [POST] /cart/add/:id
module.exports.addPost = async (req, res) => {
    console.log(req.get("Referer"));
    console.log("Đã vào addPost");
    console.log(req.params);
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy sản phẩm"
        });
    }
    //===============================
    // TRƯỜNG HỢP CHƯA ĐĂNG NHẬP
    //===============================

    if (!req.cookies.tokenUser) {

        let cart = req.cookies.cart || [];

        const index = cart.findIndex(item =>
            item.product_id == productId
        );

        if (index >= 0) {

            cart[index].quantity += 1;

        } else {

            cart.push({
                product_id: productId,
                quantity: 1
            });

        }

        res.cookie("cart", cart, {
            maxAge: 1000 * 60 * 60 * 24 * 30
        });

        return res.json({
            success: true,
            type: "cookie"
        });
    }

    //===============================
    // TRƯỜNG HỢP ĐÃ ĐĂNG NHẬP
    //===============================

    const user = await User.findOne({
        token: req.cookies.tokenUser,
        deleted: false
    });

    if (!user) {

        return res.status(401).json({
            success: false,
            message: "Không tìm thấy người dùng"
        });

    }

    //----------------------------------
    // Tìm cart của user
    //----------------------------------

    let cart = await Cart.findOne({
        user_id: user._id.toString()
    });

    //----------------------------------
    // Chưa có cart
    //----------------------------------

    if (!cart) {

        cart = new Cart({

            user_id: user._id.toString(),

            products: [
                {
                    product_id: productId,
                    quantity: 1
                }
            ]

        });

        await cart.save();

        return res.json({
            success: true,
            type: "mongodb"
        });

    }

    //----------------------------------
    // Đã có cart
    //----------------------------------

    const existProduct = cart.products.find(item =>
        item.product_id.toString() == productId
    );

    //----------------------------------
    // Có sản phẩm
    //----------------------------------

    if (existProduct) {

        existProduct.quantity += 1;

    } else {

        cart.products.push({

            product_id: productId,

            quantity: 1

        });

    }

    await cart.save();

    return res.json({
        success: true,
        type: "mongodb"
    });

}; 

// [PATCH] /cart/update/:productId/:quantity
module.exports.update = async (req, res) => {

    const productId = req.params.productId;
    let quantity = parseInt(req.params.quantity);

    //---------------------------------------
    // Kiểm tra quantity hợp lệ
    //---------------------------------------

    if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
    }

    //---------------------------------------
    // Kiểm tra sản phẩm
    //---------------------------------------

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy sản phẩm"
        });
    }

    //---------------------------------------
    // Không vượt quá tồn kho
    //---------------------------------------

    if (quantity > product.stock) {
        quantity = product.stock;
    }

    //---------------------------------------
    // CHƯA ĐĂNG NHẬP
    //---------------------------------------

    if (!req.cookies.tokenUser) {

        let cart = req.cookies.cart || [];

        const index = cart.findIndex(item =>
            item.product_id == productId
        );

        if (index >= 0) {

            cart[index].quantity = quantity;

            res.cookie("cart", cart, {
                maxAge: 1000 * 60 * 60 * 24 * 30
            });
        }

        return res.json({
            success: true,
            type: "cookie"
        });
    }

    //---------------------------------------
    // ĐÃ ĐĂNG NHẬP
    //---------------------------------------

    const user = await User.findOne({
        token: req.cookies.tokenUser,
        deleted: false
    });

    if (!user) {
    return res.status(401).json({
        success: false,
        message: "Không tìm thấy người dùng"
    });
}

    const cart = await Cart.findOne({
        user_id: user._id.toString()
    });

    if (!cart) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy giỏ hàng"
        });
    }

    const existProduct = cart.products.find(item =>
        item.product_id.toString() == productId
    );

    if (existProduct) {

        existProduct.quantity = quantity;

        await cart.save();
    }

    return res.json({
        success: true,
        type: "mongodb"
    });

}; 

// [DELETE] /cart/delete/:productId
module.exports.delete = async (req, res) => {

    const productId = req.params.productId;

    //---------------------------------------
    // CHƯA ĐĂNG NHẬP
    //---------------------------------------

    if (!req.cookies.tokenUser) {

        let cart = req.cookies.cart || [];

        cart = cart.filter(item =>
            item.product_id != productId
        );

        res.cookie("cart", cart, {
            maxAge: 1000 * 60 * 60 * 24 * 30
        });

        return res.json({
            success: true,
            type: "cookie"
        });

    }

    //---------------------------------------
    // ĐÃ ĐĂNG NHẬP
    //---------------------------------------

    const user = await User.findOne({
        token: req.cookies.tokenUser,
        deleted: false
    });

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Không tìm thấy người dùng"
        });
    }

    const cart = await Cart.findOne({
        user_id: user._id.toString()
    });

    if (!cart) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy giỏ hàng"
        });
    }

    //---------------------------------------
    // Xóa sản phẩm
    //---------------------------------------

    cart.products = cart.products.filter(item =>
        item.product_id.toString() != productId
    );

    await cart.save();

    return res.json({
        success: true,
        type: "mongodb"
    });

};