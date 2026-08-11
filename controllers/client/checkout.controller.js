const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");
const User = require("../../models/user.model");
const Notification = require("../../models/notification.model");
const Order = require("../../models/order.model");

// ==========================================
// [GET] /checkout
// Chỉ người dùng đã đăng nhập mới được checkout
// ==========================================

module.exports.index = async (req, res) => {

    try {

        // ==========================================
        // 1. KIỂM TRA ĐĂNG NHẬP
        // ==========================================

        if (!req.cookies.tokenUser) {

            return res.redirect(
                "/account/login?redirect=/checkout"
            );

        }


        // ==========================================
        // 2. LẤY USER
        // ==========================================

        const user = await User.findOne({

            token: req.cookies.tokenUser,

            deleted: false

        });


        if (!user) {

            return res.redirect(
                "/account/login?redirect=/checkout"
            );

        }


        const userId = user._id.toString();


        // ==========================================
        // 3. LẤY GIỎ HÀNG CỦA USER
        // ==========================================

        const cart = await Cart.findOne({

            user_id: userId

        });


        if (!cart || !cart.products || cart.products.length === 0) {

            return res.redirect("/cart");

        }


        const cartProducts = cart.products;


        // ==========================================
        // 4. LẤY THÔNG TIN SẢN PHẨM
        // ==========================================

        const products = [];

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

            const originalPrice = Number(
                product.priceOut || 0
            );


            const salePrice =
                Number(product.salePrice) > 0
                    ? Number(product.salePrice)
                    : originalPrice;


            const itemTotal =
                salePrice * quantity;


            totalPrice += itemTotal;


            // ======================================
            // THÊM VÀO CHECKOUT
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
        // 5. KHÔNG CÒN SẢN PHẨM HỢP LỆ
        // ==========================================

        if (products.length === 0) {

            return res.redirect("/cart");

        }


        // ==========================================
        // 6. DỮ LIỆU CHECKOUT
        // ==========================================

        const checkout = {

            products: products,

            totalPrice: totalPrice,

            paymentMethod: "bank_transfer"

        };


        // ==========================================
        // 7. RENDER
        // ==========================================

        return res.render(
            "client/pages/checkout/index",
            {

                pageTitle: "Thanh toán",

                checkout

            }
        );

    }

    catch (error) {

        console.error(
            "Lỗi trang checkout:",
            error
        );

        return res.status(500).send(
            "Có lỗi xảy ra khi tải trang thanh toán."
        );

    }

}; 


module.exports.orderPost = async (req, res) => {

    try {

        // ==========================================
        // 1. BẮT BUỘC ĐĂNG NHẬP
        // ==========================================

        if (!req.cookies.tokenUser) {

            return res.redirect(
                "/account/login?redirect=/checkout"
            );

        }


        // ==========================================
        // 2. LẤY USER
        // ==========================================

        const user = await User.findOne({

            token: req.cookies.tokenUser,

            deleted: false

        });


        if (!user) {

            return res.redirect(
                "/account/login?redirect=/checkout"
            );

        }


        const userId = user._id.toString();


        // ==========================================
        // 3. LẤY GIỎ HÀNG CỦA USER
        // ==========================================

        const cart = await Cart.findOne({

            user_id: userId

        });


        if (
            !cart ||
            !cart.products ||
            cart.products.length === 0
        ) {

            return res.redirect("/cart");

        }


        const cartProducts = cart.products;


        // ==========================================
        // 4. LẤY THÔNG TIN KHÁCH HÀNG
        // ==========================================

        const fullName =
            req.body.fullName?.trim();

        const phone =
            req.body.phone?.trim();

        const address =
            req.body.address?.trim();

        const paymentMethod =
            req.body.paymentMethod;


        // ==========================================
        // 5. KIỂM TRA DỮ LIỆU
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
        // 6. TẠO DANH SÁCH SẢN PHẨM
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


            let quantity =
                Number(item.quantity);


            if (quantity < 1) {
                quantity = 1;
            }


            if (quantity > product.stock) {
                quantity = product.stock;
            }


            if (product.stock <= 0) {
                continue;
            }


            const priceOut =
                Number(product.priceOut || 0);


            const salePrice =
                Number(product.salePrice) > 0
                    ? Number(product.salePrice)
                    : priceOut;


            const itemTotal =
                salePrice * quantity;


            totalPrice += itemTotal;


            orderProducts.push({

                product_id:
                    product._id.toString(),

                name:
                    product.name,

                thumbnail:
                    product.thumbnail || "",

                price:
                    salePrice,

                quantity:
                    quantity,

                total:
                    itemTotal

            });

        }


        // ==========================================
        // 7. KIỂM TRA SẢN PHẨM
        // ==========================================

        if (orderProducts.length === 0) {

            return res.redirect("/cart");

        }


        // ==========================================
        // 8. TẠO ORDER
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
        // 9. TẠO NỘI DUNG CHUYỂN KHOẢN
        // ==========================================

        const customerName = fullName

            .normalize("NFD")

            .replace(/[\u0300-\u036f]/g, "")

            .replace(/[^a-zA-Z0-9]/g, "")

            .toUpperCase();


        const transferContent =
            `${customerName}-${order._id.toString()}`;


        order.transferContent =
            transferContent;


        // ==========================================
        // 10. LƯU ORDER
        // ==========================================

        await order.save();


        // ==========================================
        // 11. TẠO THÔNG BÁO
        // ==========================================

        await Notification.create({

            user_id: userId,

            order_id: order._id.toString(),

            title: "Đặt hàng thành công",

            message:
                `Đơn hàng #${order._id.toString().slice(-8)} đã được tạo thành công. Vui lòng thanh toán để hoàn tất đơn hàng.`,

            type: "order_created",

            isRead: false

        });


        await Notification.create({

            user_id: userId,

            order_id: order._id.toString(),

            title: "Đang chờ thanh toán",

            message:
                `Đơn hàng #${order._id.toString().slice(-8)} đang chờ thanh toán.`,

            type: "payment_pending",

            isRead: false

        });


        // ==========================================
        // 12. XÓA GIỎ HÀNG
        // ==========================================

        await Cart.findOneAndUpdate(

            {
                user_id: userId
            },

            {
                products: []
            }

        );


        // ==========================================
        // 13. CHUYỂN SANG TRANG SUCCESS
        // ==========================================

        return res.render(
            "client/pages/checkout/success",
            {

                pageTitle:
                    "Đặt hàng thành công",

                order

            }
        );


    } catch (error) {

        console.error(
            "LỖI ĐẶT HÀNG:",
            error
        );


        return res.status(500).send(
            "Có lỗi xảy ra trong quá trình đặt hàng."
        );

    }

};