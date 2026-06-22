const systemConfig = require('../../config/system');

const dashboardRouter = require('./dashboard.route');

const productRouter = require('./product.route');
module.exports = (app) => {
    app.use(systemConfig.prefixAdmin + "/dashboard", dashboardRouter);
    app.use(systemConfig.prefixAdmin + "/product", productRouter);
};
