require("dotenv").config();

const express = require("express");
const app = express();

const database = require("./config/database");
const systemConfig = require("./config/system");
database.connect();

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