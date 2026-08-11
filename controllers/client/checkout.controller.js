const Cart = require("../../models/cart.model");
const User = require("../../models/user.model");
const Product = require("../../models/product.model");
const Order = require("../../models/order.model");


// ==========================================
// [GET] /checkout
// Hiển thị trang thanh toán
// ==========================================

module.exports.index = async (req, res) => {

    let cartProducts = [];

    // ==========================================
    // CHƯA ĐĂNG NHẬP -> COOKIE
    // ==========================================

    if (!req.cookies.tokenUser) {

        cartProducts = req.cookies.cart || [];

    }

    // ==========================================
    // ĐÃ ĐĂNG NHẬP -> MONGODB
    // ==========================================

    else {

        const user = await User.findOne({
            token: req.cookies.tokenUser,
            deleted: false
        });

        if (user) {

            const cart = await Cart.findOne({
                user_id: user._id.toString()
            });

            if (cart) {
                cartProducts = cart.products;
            }

        }

    }


    // ==========================================
    // GIỎ HÀNG RỖNG
    // ==========================================

    if (!cartProducts || cartProducts.length === 0) {

        return res.redirect("/cart");

    }


    // ==========================================
    // LẤY THÔNG TIN SẢN PHẨM
    // ==========================================

    const products = [];

    let totalPrice = 0;


    for (const item of cartProducts) {

        const product = await Product.findById(
            item.product_id
        );

        // Sản phẩm không tồn tại
        if (!product) {
            continue;
        }


        // ======================================
        // KIỂM TRA TỒN KHO
        // ======================================

        let quantity = Number(item.quantity);

        if (quantity < 1) {
            quantity = 1;
        }

        if (quantity > product.stock) {
            quantity = product.stock;
        }

        // Sản phẩm hết hàng
        if (product.stock <= 0) {
            continue;
        }


        // ======================================
        // TÍNH GIÁ
        // ======================================

        const originalPrice = Number(
            product.priceOut || 0
        );

        const salePrice =
            Number(product.salePrice) > 0
                ? Number(product.salePrice)
                : originalPrice;


        const itemTotal = salePrice * quantity;

        totalPrice += itemTotal;


        // ======================================
        // ĐƯA VÀO CHECKOUT
        // ======================================

        products.push({

            product_id: product._id.toString(),

            name: product.name,

            thumbnail: product.thumbnail,

            price: salePrice,

            originalPrice: originalPrice,

            quantity: quantity,

            total: itemTotal

        });

    }


    // ==========================================
    // KHÔNG CÒN SẢN PHẨM HỢP LỆ
    // ==========================================

    if (products.length === 0) {

        return res.redirect("/cart");

    }


    // ==========================================
    // TẠO NỘI DUNG CHUYỂN KHOẢN
    // ==========================================

    const transferContent =
        "THANHTOAN-" + Date.now();


    // ==========================================
    // DỮ LIỆU CHECKOUT
    // ==========================================

    const checkout = {

        products: products,

        totalPrice: totalPrice,

        paymentMethod: "bank_transfer",

        transferContent: transferContent

    };


    // ==========================================
    // RENDER
    // ==========================================

    res.render("client/pages/checkout/index", {

        pageTitle: "Thanh toán",

        checkout

    });

};



// ==========================================
// [POST] /checkout
// Tạo đơn hàng
// ==========================================

module.exports.orderPost = async (req, res) => {

    try {

        console.log("=================================");
        console.log("ĐÃ NHẬN POST /checkout");
        console.log("Thông tin khách hàng:", req.body);
        console.log("=================================");


        // ==========================================
        // 1. LẤY THÔNG TIN KHÁCH HÀNG
        // ==========================================

        const fullName = req.body.fullName?.trim();
        const phone = req.body.phone?.trim();
        const address = req.body.address?.trim();
        const paymentMethod = req.body.paymentMethod;


        // ==========================================
        // 2. KIỂM TRA DỮ LIỆU
        // ==========================================

        if (!fullName || !phone || !address) {

            return res.status(400).send(
                "Vui lòng nhập đầy đủ thông tin nhận hàng."
            );

        }


        if (paymentMethod !== "bank_transfer") {

            return res.status(400).send(
                "Phương thức thanh toán không hợp lệ."
            );

        }


        // ==========================================
        // 3. LẤY GIỎ HÀNG
        // ==========================================

        let cartProducts = [];

        let userId = "";


        // ==========================================
        // CHƯA ĐĂNG NHẬP
        // ==========================================

        if (!req.cookies.tokenUser) {

            cartProducts = req.cookies.cart || [];

        }


        // ==========================================
        // ĐÃ ĐĂNG NHẬP
        // ==========================================

        else {

            const user = await User.findOne({

                token: req.cookies.tokenUser,

                deleted: false

            });


            if (!user) {

                return res.status(401).send(
                    "Phiên đăng nhập không hợp lệ."
                );

            }


            userId = user._id.toString();


            const cart = await Cart.findOne({

                user_id: userId

            });


            if (cart) {

                cartProducts = cart.products;

            }

        }


        // ==========================================
        // 4. KIỂM TRA GIỎ HÀNG
        // ==========================================

        if (!cartProducts || cartProducts.length === 0) {

            return res.redirect("/cart");

        }


        // ==========================================
        // 5. TẠO DANH SÁCH SẢN PHẨM ĐƠN HÀNG
        // ==========================================

        const orderProducts = [];

        let totalPrice = 0;


        for (const item of cartProducts) {

            const product = await Product.findById(
                item.product_id
            );


            if (!product) {
                continue;
            }


            // ======================================
            // KIỂM TRA TỒN KHO
            // ======================================

            let quantity = Number(item.quantity);


            if (quantity < 1) {
                quantity = 1;
            }


            if (quantity > product.stock) {
                quantity = product.stock;
            }


            if (product.stock <= 0) {
                continue;
            }


            // ======================================
            // TÍNH GIÁ
            // ======================================

            const priceOut = Number(
                product.priceOut || 0
            );


            const salePrice =
                Number(product.salePrice) > 0
                    ? Number(product.salePrice)
                    : priceOut;


            const itemTotal =
                salePrice * quantity;


            totalPrice += itemTotal;


            // ======================================
            // THÊM VÀO ORDER
            // ======================================

            orderProducts.push({

                product_id: product._id.toString(),

                name: product.name,

                thumbnail: product.thumbnail || "",

                price: salePrice,

                quantity: quantity,

                total: itemTotal

            });

        }


        // ==========================================
        // 6. KIỂM TRA SẢN PHẨM
        // ==========================================

        if (orderProducts.length === 0) {

            return res.redirect("/cart");

        }


        // ==========================================
        // ==========================================
        // 7. TẠO ORDER TRƯỚC
        // ==========================================

        const order = new Order({

            user_id: userId,

            customerInfo: {

                fullName: fullName,

                phone: phone,

                address: address

            },

            products: orderProducts,

            totalPrice: totalPrice,

            paymentMethod: "bank_transfer",

            paymentStatus: "pending",

            orderStatus: "pending"

        });


        // ==========================================
        // 8. TẠO NỘI DUNG CHUYỂN KHOẢN
        //    Tên người dùng + mã đơn hàng
        // ==========================================

        const customerName = fullName
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase();

        const transferContent =
            `${customerName}-${order._id.toString()}`;


        // Gắn vào Order
        order.transferContent = transferContent;


        // ==========================================
        // 9. LƯU ORDER
        // ==========================================

        await order.save();


        console.log("=================================");
        console.log("ĐẶT HÀNG THÀNH CÔNG");
        console.log("Order ID:", order._id);
        console.log("Tổng tiền:", totalPrice);
        console.log("Nội dung:", transferContent);
        console.log("=================================");


        // ==========================================
        // 10. XÓA GIỎ HÀNG
        // ==========================================

        if (!req.cookies.tokenUser) {

            // Xóa cart trong cookie

            res.cookie("cart", [], {

                maxAge: 0

            });

        }

        else {

            // Xóa cart trong MongoDB

            await Cart.findOneAndUpdate(

                {
                    user_id: userId
                },

                {
                    products: []
                }

            );

        }


        // ==========================================
        // 11. CHUYỂN SANG TRANG THÀNH CÔNG
        // ==========================================

        return res.render(
            "client/pages/checkout/success",
            {

                pageTitle: "Đặt hàng thành công",

                order

            }
        );


    }

    catch (error) {

        console.error(
            "LỖI ĐẶT HÀNG:",
            error
        );


        return res.status(500).send(
            "Có lỗi xảy ra trong quá trình đặt hàng."
        );

    }

};


// // [POST] /checkout
// module.exports.orderPost = async (req, res) => {

//     console.log("ĐÃ NHẬN POST /checkout");

//     console.log("Thông tin đặt hàng:", req.body);

//     return res.send("Đặt hàng thành công!");

// };