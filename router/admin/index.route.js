const systemConfig = require("../../config/system");

const dashboardRouter = require("./dashboard.route");
const productRouter = require("./product.route");
const orderRouter = require("./order.route");

module.exports = (app) => {

    // Dashboard
    app.use(
        systemConfig.prefixAdmin + "/dashboard",
        dashboardRouter
    );

    // Product
    app.use(
        systemConfig.prefixAdmin + "/product",
        productRouter
    );

    // Order
    app.use(
        systemConfig.prefixAdmin + "/orders",
        orderRouter
    );

};