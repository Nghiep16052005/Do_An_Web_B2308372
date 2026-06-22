const homeRoute = require("./home.route");
const productRoute = require("./product.route");

module.exports = (app) => {
  app.use("/", homeRoute);

  app.use("/products", productRoute);
} 

const accountRoutes = require("./account.route");

module.exports = (app) => {

  app.use("/", homeRoute);

  app.use("/products", productRoute);

  app.use("/account", accountRoutes);

}