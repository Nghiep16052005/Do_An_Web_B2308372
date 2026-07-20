require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser"); 
const methodOverride = require("method-override");
const userMiddleware = require("./middlewares/client/user.middleware");
const app = express();

const database = require("./config/database");
const systemConfig = require("./config/system");
database.connect();

app.use(express.urlencoded({
    extended: true
})); 
app.use(cookieParser());
app.use(userMiddleware.infoUser);
app.set("views", "./views");
app.set("view engine", "pug");

// App Local Variables
app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.use(express.static("public"));

const adminRoutes = require("./router/admin/index.route");
const clientRoutes = require("./router/client/index.route");

adminRoutes(app);
clientRoutes(app);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});