const homeRoute = require("./home.route");
const productRoute = require("./product.route");
const accountRoutes = require("./account.route");
const cartRoutes = require("./cart.route");
const checkoutRoute = require("./checkout.route");
const paymentRoute = require("./payment.route");
const notificationRoute = require("./notification.route");

module.exports = (app) => {
  app.use("/", homeRoute);
  app.use("/products", productRoute);
  app.use("/account", accountRoutes);
  app.use("/cart", cartRoutes); 
  app.use("/checkout", checkoutRoute);
  app.use("/payment", paymentRoute);
  app.use("/notifications", notificationRoute);
};