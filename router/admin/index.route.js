const systemConfig = require('../../config/system');

const dashboardRouter = require('./dashboard.route');

module.exports = (app) => {
    app.use(systemConfig.prefixAdmin + "/dashboard", dashboardRouter);
};
