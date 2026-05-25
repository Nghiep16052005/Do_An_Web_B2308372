const homeRouter = require('./home.route');
const productRouter = require('./product.route');

module.exports = (app) => {
    app.use('/admin/dashboard', homeRouter);
    app.use('/admin/products', productRouter);
}